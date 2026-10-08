import { injectable } from "inversify";
import { randomInt } from "node:crypto";
import type { Redis } from "ioredis";
import type { IOtpService } from "../interfaces/otp.service.interface.js";
import { getRedisClient } from "@/config/redis.config.js";

const DEFAULT_OTP_TTL_SECONDS = 300; // 5 minutes
const DEFAULT_COOLDOWN_SECONDS = 60; // 60 seconds
const DEFAULT_BLACKLIST_TTL_SECONDS = 86400; // 24 hours

@injectable()
export class RedisOtpService implements IOtpService {
  private readonly redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  private getOtpKey(phone: string): string {
    return `otp:phone:${phone.trim()}`;
  }

  private getCooldownKey(phone: string): string {
    return `otp:cooldown:${phone.trim()}`;
  }

  private getBlacklistKey(token: string): string {
    return `token:blacklist:${token}`;
  }

  generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  async storeOtp(
    phone: string,
    otp: string,
    ttlSeconds: number = DEFAULT_OTP_TTL_SECONDS,
  ): Promise<void> {
    const key = this.getOtpKey(phone);
    await this.redis.set(key, otp, "EX", ttlSeconds);
  }

  async getOtp(phone: string): Promise<string | null> {
    const key = this.getOtpKey(phone);
    return this.redis.get(key);
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const key = this.getOtpKey(phone);
    const storedOtp = await this.redis.get(key);

    if (!storedOtp || storedOtp !== otp.trim()) {
      return false;
    }

    // One-time use: delete after successful verification
    await this.redis.del(key);
    return true;
  }

  async deleteOtp(phone: string): Promise<void> {
    const key = this.getOtpKey(phone);
    await this.redis.del(key);
  }

  async isCooldownActive(phone: string): Promise<boolean> {
    const key = this.getCooldownKey(phone);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async setCooldown(
    phone: string,
    cooldownSeconds: number = DEFAULT_COOLDOWN_SECONDS,
  ): Promise<void> {
    const key = this.getCooldownKey(phone);
    await this.redis.set(key, "1", "EX", cooldownSeconds);
  }

  async blacklistToken(
    token: string,
    ttlSeconds: number = DEFAULT_BLACKLIST_TTL_SECONDS,
  ): Promise<void> {
    const key = this.getBlacklistKey(token);
    await this.redis.set(key, "1", "EX", ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = this.getBlacklistKey(token);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}
