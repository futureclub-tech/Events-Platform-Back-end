import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import {
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { UserService } from "../../users/service/user.service.js";
import { User } from "../../users/domain/User.js";
import type { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { LoginUserRequestDTO } from "../dto/login-user.dto.js";
import { TokenService } from "./token.service.js";
import { RegisterUserRequestDTO } from "../dto/register-user.dto.js";
import { RESPONSE_MESSAGE } from "../../../shared/enum/response-message.enum.js";
import { ResendOTPRequestDTO, VerifyOTPRequestDTO } from "../dto/otp.dto.js";

const scrypt = promisify(scryptCallback);
type PendingRegistration = {
  fullName: string;
  phone: string;
  passwordHash: string;
  otp: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly tokenService: TokenService,
  ) {}

  async register(input: RegisterUserRequestDTO) {
    const fullName = input.fullName?.trim();
    const phone = input.phone?.trim();

    // fetch user
    const user = await this.users.findByPhone(phone);

    if (user)
      throw new ConflictException({
        code: RESPONSE_MESSAGE.PHONE_ALREADY_REGISTERED,
        message: "Phone number is already registered",
      });

    const otp = this.generateOtp();
    // Pending Registration
    const pending: PendingRegistration = {
      fullName,
      phone,
      passwordHash: await this.hashPassword(input.password),
      otp,
    };
    await this.cacheManager.set(this.otpKey(phone), pending, 300 * 1000);
    console.log("GENERATED OTP", otp);

    // TODO SEND OTP
  }

  async verifyOtp(input: VerifyOTPRequestDTO) {
    const phone = input.phone;
    // otp key
    const key = this.otpKey(input.phone);

    // gets otp from cache with key
    const stored = await this.cacheManager.get(key);
    // OTP not found
    if (!stored)
      throw new UnauthorizedException({
        code: RESPONSE_MESSAGE.OTP_INVALID,
        message: "OTP is invalid or expired",
      });

    const pending = stored as PendingRegistration;

    // OTP is invalid
    if (pending.otp !== input.otp)
      throw new UnauthorizedException({
        code: RESPONSE_MESSAGE.OTP_INVALID,
        message: "OTP is invalid or expired",
      });

    // create a user
    await this.users.createPending({
      fullName: pending.fullName,
      phone,
      passwordHash: pending.passwordHash,
    });
    const user = await this.users.verify(phone);

    // deletes OTP
    await this.cacheManager.del(key);

    return {
      user: this.publicUser(user),
    };
  }

  async resendOtp(input: ResendOTPRequestDTO) {
    const phone = input.phone;
    // get stored otp
    const stored = (await this.cacheManager.get(this.otpKey(phone))) as
      PendingRegistration | undefined;

    // If no otp found
    if (!stored)
      throw new BadRequestException({
        code: RESPONSE_MESSAGE.OTP_RESEND_FAILED,
        message: "No pending registration found or OTP expired",
      });

    const pending = stored as PendingRegistration;
    // updating OTP
    pending.otp = this.generateOtp();
    console.log("UPDATED OTP", pending.otp);
    // Saving it to cache
    await this.cacheManager.set(this.otpKey(phone), pending, 300 * 1000);

    // TODO SEND OTP
  }

  async login(input: LoginUserRequestDTO) {
    // fetching User
    const user = await this.users.findByPhone(input.phone);

    const invalidCredentials = new UnauthorizedException({
      code: "INVALID_CREDENTIALS",
      message: "Invalid phone or password",
    });

    // If user not found throws error
    if (!user) throw invalidCredentials;

    // verifying password
    const verifiedPassword = await this.verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!verifiedPassword) throw invalidCredentials;

    if (!user.isVerified)
      throw new UnauthorizedException(
        "Verify your phone number before logging in",
      );

    // creating accessToken
    const tokens = this.tokenService.generateAuthTokens(user.id);
    return {
      ...tokens,
      user: this.publicUser(user),
    };
  }

  /**
   * OTP KEY saved in redis
   * @param phone PHONE Number
   * @returns string
   */
  private otpKey(phone: string) {
    return `auth:register:otp:${phone}`;
  }

  /**
   * Generate random 6 digit otp
   * @returns string
   */
  private generateOtp() {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }
  /**
   * Hashed User password
   * @param password password
   * @returns hashedpassword
   */
  private async hashPassword(password: string) {
    const salt =
      randomInt(0, 2 ** 31).toString(16) + randomInt(0, 2 ** 31).toString(16);
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derived.toString("hex")}`;
  }
  /**
   * Verify password with hashed password from db
   * @param password user password
   * @param encoded hashed password
   * @returns boolean
   */
  private async verifyPassword(password: string, encoded: string | null) {
    if (!encoded) return false;
    const [salt, hash] = encoded.split(":");
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, "hex");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      isVerified: user.isVerified,
    };
  }
}
