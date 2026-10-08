import { Router } from 'express';
import { container } from '@/di/container.js';
import { TYPES } from '@/di/types.js';
import { AuthController } from '@/controllers/auth.controller.js';
import type { IAuthTokenService } from '@/services/interfaces/auth-token.service.interface.js';
import { authenticate } from '@/middleware/authenticate.js';
import { validateRequest } from '@/middleware/validate-request.js';
import {
  loginSchema,
  registerSchema,
  resendOtpSchema,
  verifyOtpSchema,
} from '@/schemas/auth.schema.js';

const router = Router();
const authController = container.get<AuthController>(TYPES.AuthController);
const authTokenService = container.get<IAuthTokenService>(TYPES.AuthTokenService);


router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', validateRequest(resendOtpSchema), authController.resendOtp);
router.get('/me', authenticate(authTokenService), authController.me);

export default router;
