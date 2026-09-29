import { User } from "../domain/User.js";

export abstract class UserRepository {
  abstract findByPhone(phone: string): Promise<User | null>;
  abstract create(input: {
    fullName: string;
    phone: string;
    passwordHash: string;
    isVerified: boolean;
  }): Promise<User>;
  abstract markVerified(phone: string): Promise<User | null>;
}
