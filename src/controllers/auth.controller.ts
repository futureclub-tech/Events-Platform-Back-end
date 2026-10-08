import { inject, injectable } from 'inversify';
import type { NextFunction, Request, Response } from 'express';
import { TYPES } from '@/di/types.js';
import type { IAuthService } from '@/services/interfaces/auth.service.interface.js';
import { RESPONSE_MESSAGE } from '@/shared/constants/response-message.enum.js';
import { successResponse } from '@/shared/types/api-response.js';
import { NotFoundError, UnauthorizedError } from '@/shared/errors/app-error.js';
import type {
  LoginBody,
  RegisterBody,
  ResendOtpBody,
  VerifyOtpBody,
} from '@/schemas/auth.schema.js';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@injectable()
export class AuthController {
  constructor(@inject(TYPES.AuthService) private readonly authService: IAuthService) {}

  register = async (
    request: Request<Record<string, string>, unknown, RegisterBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.register(request.body);
      response.status(201).json(successResponse(RESPONSE_MESSAGE.REGISTRATION_SUCCESS, result));
    } catch (error) {
      next(error);
    }
  };

  login = async (
    request: Request<Record<string, string>, unknown, LoginBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { user, accessToken, refreshToken } = await this.authService.login(
        request.body.phone,
        request.body.password,
      );
      const secure = process.env['NODE_ENV'] === 'production';

      response
        .cookie('accessToken', accessToken, {
          httpOnly: true,
          secure,
          sameSite: 'lax',
          path: '/',
          maxAge: ACCESS_TOKEN_MAX_AGE_MS,
        })
        .cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure,
          sameSite: 'lax',
          path: '/',
          maxAge: REFRESH_TOKEN_MAX_AGE_MS,
        })
        .json(successResponse(RESPONSE_MESSAGE.LOGIN_SUCCESS, { user }));
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (
    request: Request<Record<string, string>, unknown, VerifyOtpBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.authService.verifyOtp(request.body.phone, request.body.otp);
      response.json(successResponse(RESPONSE_MESSAGE.OTP_VERIFIED, user));
    } catch (error) {
      next(error);
    }
  };

  resendOtp = async (
    request: Request<Record<string, string>, unknown, ResendOtpBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.resendOtp(request.body.phone);
      response.json(successResponse(RESPONSE_MESSAGE.OTP_RESEND_SUCCESS, result));
    } catch (error) {
      next(error);
    }
  };

  me = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      if (!request.auth) {
        throw new UnauthorizedError(RESPONSE_MESSAGE.UNAUTHORIZED);
      }

      const user = await this.authService.getUserById(request.auth.userId);
      if (!user) {
        throw new NotFoundError(RESPONSE_MESSAGE.USER_NOT_FOUND);
      }

      response.json(successResponse(RESPONSE_MESSAGE.PROFILE_FETCHED, user));
    } catch (error) {
      next(error);
    }
  };
}
