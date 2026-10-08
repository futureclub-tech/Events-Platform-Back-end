import { User } from '@/domain/entities/user.entity.js';
import { UserRole } from '@/domain/enums/user-role.enum.js';
import type { IUserDocument } from '@/repositories/models/user.model.js';
import type { IEntityMapper } from './entity.mapper.js';

export class UserMapper implements IEntityMapper<User, IUserDocument> {
  toDomain(document: IUserDocument): User {
    return new User(
      document._id.toString(),
      document.fullname,
      document.phone,
      document.password,
      document.email,
      document.google_id,
      document.profile_pic_key,
      document.is_verified,
      document.isBlocked,
      document.role ?? UserRole.USER,
      document.created_at,
      document.updated_at,
    );
  }

  toPersistence(entity: User): Record<string, unknown> {
    return {
      fullname: entity.fullname,
      email: entity.email,
      password: entity.password,
      phone: entity.phone,
      google_id: entity.google_id,
      profile_pic_key: entity.profile_pic_key,
      is_verified: entity.is_verified,
      isBlocked: entity.isBlocked,
      role: entity.role,
    };
  }
}
