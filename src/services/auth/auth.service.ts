import { injectable, inject } from 'inversify';
import { TYPES } from '@/di/types.js';
import { User } from '@/domain/entities/user.entity.js';
import { UserRole } from '@/domain/enums/user-role.enum.js';
import type {
  IAuthService,
  RegisterUserInput,
  LoginResult,
  PublicUser,
} from '../interfaces/auth.service.interface.js';
import type { IUserRepository } from '@/repositories/interfaces/user.repository.interface.js';
import type { IOtpService } from '../interfaces/otp.service.interface.js';
import type { IUnitOfWork } from '@/infrastructure/unit-of-work/unit-of-work.interface.js';
import type { IAuthTokenService } from '@/services/interfaces/auth-token.service.interface.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/shared/errors/app-error.js';
import { RESPONSE_MESSAGE } from '@/shared/constants/response-message.enum.js';
import { hashPassword, verifyPassword } from '@/shared/utils/password.util.js';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.OtpService) private readonly otpService: IOtpService,
    @inject(TYPES.UnitOfWork) private readonly unitOfWork: IUnitOfWork,
    @inject(TYPES.AuthTokenService) private readonly authTokenService: IAuthTokenService,
  ) {}

  async register(input: RegisterUserInput): Promise<{ message: string }> {
    const hashedPassword = await hashPassword(input.password);

    const user = await this.unitOfWork.execute(async (session) => {
      const existingPhone = await this.userRepository.findByPhone(input.phone, session);
      if (existingPhone) {
        throw new ConflictError(RESPONSE_MESSAGE.PHONE_ALREADY_REGISTERED);
      }

      const normalizedEmail = input.email?.toLowerCase().trim() || null;
      if (normalizedEmail && (await this.userRepository.findByEmail(normalizedEmail, session))) {
        throw new ConflictError(RESPONSE_MESSAGE.EMAIL_ALREADY_REGISTERED);
      }

      return this.userRepository.create(
        new User(
          undefined,
          input.fullname.trim(),
          input.phone.trim(),
          hashedPassword,
          normalizedEmail,
          input.google_id ?? null,
          input.profile_pic_key ?? null,
          false,
          false,
          UserRole.USER,
        ),
        session,
      );
    });

    // Generate and send initial OTP via Redis
    const otp = this.otpService.generateOtp();
    await this.otpService.storeOtp(user.phone, otp);
    await this.otpService.setCooldown(user.phone);

    console.log(`[OTP Generated for Registration] Phone: ${user.phone}, OTP: ${otp}`);

    return {
      message: 'Registration successful. Please verify OTP sent to your phone.',
    };
  }

  async login(phone: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByPhone(phone);

    if (!user) {
      throw new UnauthorizedError(RESPONSE_MESSAGE.INVALID_CREDENTIALS);
    }

    if (user.isBlocked) {
      throw new ForbiddenError(RESPONSE_MESSAGE.USER_BLOCKED);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(RESPONSE_MESSAGE.INVALID_CREDENTIALS);
    }

    if (!user.is_verified) {
      throw new UnauthorizedError(RESPONSE_MESSAGE.OTP_INVALID, {
        message: 'Please verify your phone number before logging in.',
      });
    }

    const publicUser = user.toPublicJson();
    const tokens = this.authTokenService.issueTokens(publicUser);
    return { user: publicUser, ...tokens };
  }

  async logout(_userId: string, token?: string): Promise<void> {
    if (token) {
      await this.otpService.blacklistToken(token);
    }
  }

  async verifyOtp(phone: string, otp: string): Promise<void> {
    const isOtpValid = await this.otpService.verifyOtp(phone, otp);
    if (!isOtpValid) {
      throw new UnauthorizedError(RESPONSE_MESSAGE.OTP_INVALID);
    }

    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundError(RESPONSE_MESSAGE.USER_NOT_FOUND);
    }

    const verifiedUser = await this.userRepository.verifyUser(user.id);
    if (!verifiedUser) {
      throw new NotFoundError(RESPONSE_MESSAGE.USER_NOT_FOUND);
    }
  }

  async resendOtp(phone: string): Promise<{ cooldownSeconds: number }> {
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundError(RESPONSE_MESSAGE.USER_NOT_FOUND);
    }

    const isCooldownActive = await this.otpService.isCooldownActive(phone);
    if (isCooldownActive) {
      throw new BadRequestError(RESPONSE_MESSAGE.OTP_RESEND_COOLDOWN_ACTIVE);
    }

    const newOtp = this.otpService.generateOtp();
    await this.otpService.storeOtp(phone, newOtp);
    await this.otpService.setCooldown(phone, 60);

    console.log(`[OTP Resent] Phone: ${phone}, OTP: ${newOtp}`);

    return { cooldownSeconds: 60 };
  }

  async getUserById(id: string): Promise<PublicUser | null> {
    const user = await this.userRepository.findById(id);
    return user ? user.toPublicJson() : null;
  }
}
