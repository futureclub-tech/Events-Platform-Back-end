import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../domain/User.js";
import { UserModel } from "../model/user.schema.js";
import { UserRepository } from "./user.repository.js";

@Injectable()
export class MongoUserRepository extends UserRepository {
  constructor(
    @InjectModel(UserModel.name)
    private readonly model: Model<UserModel>,
  ) {
    super();
  }

  async findByPhone(phone: string): Promise<User | null> {
    const model = await this.model
      .findOne({ phone })
      .select("+passwordHash")
      .exec();
    return model ? this.toDomain(model) : null;
  }

  async create(input: {
    fullName: string;
    phone: string;
    passwordHash: string;
    isVerified: boolean;
  }): Promise<User> {
    return this.toDomain(await this.model.create({ ...input }));
  }

  async markVerified(phone: string): Promise<User | null> {
    const model = await this.model
      .findOneAndUpdate({ phone }, { isVerified: true }, { new: true })
      .select("+passwordHash")
      .exec();
    return model ? this.toDomain(model) : null;
  }

  private toDomain(model: UserModel): User {
    return new User(
      String(model._id),
      model.fullName,
      model.phone,
      model.passwordHash ?? null,
      model.isVerified,
    );
  }
}
