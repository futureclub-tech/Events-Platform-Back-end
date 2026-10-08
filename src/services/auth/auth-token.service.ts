import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import type { PublicUser } from '@/dto/user.dto.js';
import { UserRole } from '@/domain/enums/user-role.enum.js';
import { UnauthorizedError } from '@/shared/errors/app-error.js';
import { RESPONSE_MESSAGE } from '@/shared/constants/response-message.enum.js';
import type {
  AuthTokenPair,
  AuthenticatedUser,
  IAuthTokenService,
} from '@/services/interfaces/auth-token.service.interface.js';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function getSigningSecret(name: 'ACCESS_TOKEN_SECRET' | 'REFRESH_TOKEN_SECRET'): string {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`${name} must be configured`);
  }
  return secret;
}

@injectable()
export class AuthTokenService implements IAuthTokenService {
  issueTokens(user: PublicUser): AuthTokenPair {
    const claims = { sub: user.id, role: user.role };
    return {
      accessToken: jwt.sign(
        { ...claims, tokenUse: 'access' },
        getSigningSecret('ACCESS_TOKEN_SECRET'),
        { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
      ),
      refreshToken: jwt.sign(
        { ...claims, tokenUse: 'refresh' },
        getSigningSecret('REFRESH_TOKEN_SECRET'),
        { expiresIn: REFRESH_TOKEN_TTL_SECONDS },
      ),
    };
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    try {
      const payload = jwt.verify(token, getSigningSecret('ACCESS_TOKEN_SECRET'));
      if (
        typeof payload === 'string' ||
        typeof payload.sub !== 'string' ||
        payload.tokenUse !== 'access' ||
        !Object.values(UserRole).includes(payload.role as UserRole)
      ) {
        throw new Error('Invalid access token payload');
      }

      return { userId: payload.sub, role: payload.role as UserRole };
    } catch {
      throw new UnauthorizedError(RESPONSE_MESSAGE.UNAUTHORIZED);
    }
  }
}
