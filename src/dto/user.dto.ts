import type { UserRole } from "@/domain/enums/user-role.enum.js";

export interface PublicUser {
  id: string;
  fullname: string;
  email: string | null;
  phone: string;
  google_id: string | null;
  profile_pic_key: string | null;
  is_verified: boolean;
  isBlocked: boolean;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}
