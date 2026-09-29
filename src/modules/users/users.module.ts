import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "./controller/user.controller.js";
import { UserService } from "./service/user.service.js";
import { UserModel, UserSchema } from "./model/user.schema.js";
import { UserRepository } from "./repository/user.repository.js";
import { MongoUserRepository } from "./repository/mongo-user.repository.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserModel.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepository,
      useClass: MongoUserRepository,
    },
  ],
  exports: [UserService],
})
export class UsersModule {}
