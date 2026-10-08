import type { ClientSession } from 'mongoose';
import type { IBaseRepository } from './base.repository.interface.js';
import type { User } from '@/domain/entities/user.entity.js';

export interface IUserRepository extends IBaseRepository<User> {
  findByPhone(phone: string, session?: ClientSession): Promise<User | null>;
  findByEmail(email: string, session?: ClientSession): Promise<User | null>;
  findByGoogleId(googleId: string, session?: ClientSession): Promise<User | null>;
  verifyUser(id: string, session?: ClientSession): Promise<User | null>;
  updatePassword(id: string, newHashedPassword: string, session?: ClientSession): Promise<boolean>;
  setBlockedStatus(id: string, isBlocked: boolean, session?: ClientSession): Promise<User | null>;
}
