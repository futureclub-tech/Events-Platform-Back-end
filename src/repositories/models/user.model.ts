import { Schema, model, type Document, type Types } from "mongoose";
import { UserRole } from "@/domain/enums/user-role.enum.js";

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  fullname: string;
  email: string | null;
  password: string;
  phone: string;
  google_id: string | null;
  profile_pic_key: string | null;
  is_verified: boolean;
  isBlocked: boolean;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    google_id: {
      type: String,
      default: null,
    },
    profile_pic_key: {
      type: String,
      default: null,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

export const UserModel = model<IUserDocument>("User", userSchema);
