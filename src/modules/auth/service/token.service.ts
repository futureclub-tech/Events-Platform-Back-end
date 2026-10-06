import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Cache } from "cache-manager";
import { createHash, randomBytes } from "crypto";
import { User } from "../../users/domain/User.js";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private refreshTokenKey(hashedToken: string): string {
    return `auth:refresh:${hashedToken}`;
  }

  async generateAuthTokens(userId: string) {
    const accessToken = this.jwt.sign({ sub: userId }, { expiresIn: "15m" });
    const rawRefreshToken = randomBytes(40).toString("hex");
    const hashedRefreshToken = this.hashToken(rawRefreshToken);

    const DAY_MS = Number(process.env.REFRESH_DAYS) * 24 * 60 * 60 * 1000;
    await this.cacheManager.set(
      this.refreshTokenKey(hashedRefreshToken),
      userId,
      DAY_MS,
    );

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    findUserById: (id: string) => Promise<User>,
  ) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token not provided",
      });
    }

    const hashedToken = this.hashToken(rawRefreshToken);
    const key = this.refreshTokenKey(hashedToken);

    const userId = await this.cacheManager.get<string>(key);
    if (!userId) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid or expired",
      });
    }

    await this.cacheManager.del(key);

    const user = await findUserById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: "USER_NOT_FOUND",
        message: "User no longer exists",
      });
    }

    return this.generateAuthTokens(user.id);
  }

  async revokeToken(rawRefreshToken: string) {
    if (rawRefreshToken) {
      const hashedToken = this.hashToken(rawRefreshToken);
      await this.cacheManager.del(this.refreshTokenKey(hashedToken));
    }
  }
}
