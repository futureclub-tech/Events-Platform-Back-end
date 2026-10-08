export interface IOtpService {
  generateOtp(): string;
  storeOtp(phone: string, otp: string, ttlSeconds?: number): Promise<void>;
  getOtp(phone: string): Promise<string | null>;
  verifyOtp(phone: string, otp: string): Promise<boolean>;
  deleteOtp(phone: string): Promise<void>;
  isCooldownActive(phone: string): Promise<boolean>;
  setCooldown(phone: string, cooldownSeconds?: number): Promise<void>;
  blacklistToken(token: string, ttlSeconds?: number): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}
