import { ConflictException, Injectable } from "@nestjs/common";
import { User } from "../domain/User.js";
import { UserRepository } from "../repository/user.repository.js";

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  findByPhone(phone: string): Promise<User | null> {
    return this.users.findByPhone(phone);
  }

  async createPending(input: {
    fullName: string;
    phone: string;
    passwordHash: string;
  }): Promise<User> {
    if (await this.users.findByPhone(input.phone))
      throw new ConflictException("Phone number is already registered");
    return this.users.create({ ...input, isVerified: false });
  }

  async verify(phone: string): Promise<User> {
    const user = await this.users.markVerified(phone);
    if (!user)
      throw new ConflictException("Registration could not be verified");
    return user;
  }
}
