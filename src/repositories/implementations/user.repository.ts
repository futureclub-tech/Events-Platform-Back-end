import { injectable } from 'inversify';
import type { ClientSession } from 'mongoose';
import { BaseRepository } from './base.repository.js';
import type { IUserRepository } from '../interfaces/user.repository.interface.js';
import { UserMapper } from '../mappers/user.mapper.js';
import type { User } from '@/domain/entities/user.entity.js';
import { UserModel, type IUserDocument } from '../models/user.model.js';

@injectable()
export class UserRepository extends BaseRepository<User, IUserDocument> implements IUserRepository {
  constructor() {
    super(UserModel, new UserMapper());
  }

  async findByPhone(phone: string, session?: ClientSession): Promise<User | null> {
    return this.findOne({ phone: phone.trim() }, session);
  }

  async findByEmail(email: string, session?: ClientSession): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase().trim() }, session);
  }

  async findByGoogleId(google_id: string, session?: ClientSession): Promise<User | null> {
    return this.findOne({ google_id }, session);
  }

  async verifyUser(id: string, session?: ClientSession): Promise<User | null> {
    return this.updateById(id, { is_verified: true }, session);
  }

  async updatePassword(
    id: string,
    newHashedPassword: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await this.updateById(id, { password: newHashedPassword }, session);
    return result !== null;
  }

  async setBlockedStatus(
    id: string,
    isBlocked: boolean,
    session?: ClientSession,
  ): Promise<User | null> {
    return this.updateById(id, { isBlocked }, session);
  }
}
