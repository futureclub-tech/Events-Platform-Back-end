import { HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type UserDocument = HydratedDocument<UserModel>;

@Schema({ timestamps: true })
export class UserModel {
  _id!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  fullName!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  phone!: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  passwordHash!: string;

  @Prop({ type: Boolean, default: false })
  isVerified!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
