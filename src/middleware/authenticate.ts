import type { RequestHandler } from 'express';
import { UnauthorizedError } from '@/shared/errors/app-error.js';
import { RESPONSE_MESSAGE } from '@/shared/constants/response-message.enum.js';
import type {
  AuthenticatedUser,
  IAuthTokenService,
} from '@/services/interfaces/auth-token.service.interface.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export function authenticate(tokenService: IAuthTokenService): RequestHandler {
  return (request, _response, next) => {
    const accessToken: unknown = request.cookies?.accessToken;
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      next(new UnauthorizedError(RESPONSE_MESSAGE.UNAUTHORIZED));
      return;
    }

    try {
      request.auth = tokenService.verifyAccessToken(accessToken);
      next();
    } catch (error) {
      next(error);
    }
  };
}
