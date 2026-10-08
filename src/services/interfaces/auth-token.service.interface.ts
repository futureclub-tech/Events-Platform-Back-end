import type { PublicUser } from '@/dto/user.dto.js';
import type { UserRole } from '@/domain/enums/user-role.enum.js';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}

export interface IAuthTokenService {
  issueTokens(user: PublicUser): AuthTokenPair;
  verifyAccessToken(token: string): AuthenticatedUser;
}
