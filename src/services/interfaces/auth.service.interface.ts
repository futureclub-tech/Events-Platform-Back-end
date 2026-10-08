import type { User } from '@/domain/entities/user.entity.js';
import type { PublicUser } from '@/dto/user.dto.js';

export type { PublicUser };

export interface RegisterUserInput {
  fullname: string;
  phone: string;
  password: string;
  email?: string | null | undefined;
  google_id?: string | null | undefined;
  profile_pic_key?: string | null | undefined;
}

export interface LoginResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface IAuthService {
  register(input: RegisterUserInput): Promise<{ message: string }>;
  login(phone: string, password: string): Promise<LoginResult>;
  logout(userId: string, token?: string): Promise<void>;
  verifyOtp(phone: string, otp: string): Promise<void>;
  resendOtp(phone: string): Promise<{ cooldownSeconds: number }>;
  getUserById(id: string): Promise<PublicUser | null>;
}
