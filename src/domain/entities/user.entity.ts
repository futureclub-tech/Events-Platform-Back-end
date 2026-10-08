import { UserRole } from '@/domain/enums/user-role.enum.js';

export class User {
  constructor(
    private readonly _id: string | undefined,
    private _fullname: string,
    private _phone: string,
    private _password: string,
    private _email: string | null = null,
    private _google_id: string | null = null,
    private _profile_pic_key: string | null = null,
    private _is_verified: boolean = false,
    private _isBlocked: boolean = false,
    private _role: UserRole = UserRole.USER,
    private readonly _created_at: Date = new Date(),
    private _updated_at: Date = new Date(),
  ) {}

  get id(): string {
    if (!this._id) {
      throw new Error('User has not been persisted yet');
    }
    return this._id;
  }

  get fullname(): string {
    return this._fullname;
  }

  get phone(): string {
    return this._phone;
  }

  get password(): string {
    return this._password;
  }

  get email(): string | null {
    return this._email;
  }

  get google_id(): string | null {
    return this._google_id;
  }

  get profile_pic_key(): string | null {
    return this._profile_pic_key;
  }

  get is_verified(): boolean {
    return this._is_verified;
  }

  get isBlocked(): boolean {
    return this._isBlocked;
  }

  get role(): UserRole {
    return this._role;
  }

  get created_at(): Date {
    return this._created_at;
  }

  get updated_at(): Date {
    return this._updated_at;
  }

  // Getters for camelCase compatibility
  get isVerified(): boolean {
    return this._is_verified;
  }

  get googleId(): string | null {
    return this._google_id;
  }

  get profilePicKey(): string | null {
    return this._profile_pic_key;
  }

  get createdAt(): Date {
    return this._created_at;
  }

  get updatedAt(): Date {
    return this._updated_at;
  }

  // Domain invariants & helper methods
  markVerified(): void {
    this._is_verified = true;
    this._updated_at = new Date();
  }

  block(): void {
    this._isBlocked = true;
    this._updated_at = new Date();
  }

  unblock(): void {
    this._isBlocked = false;
    this._updated_at = new Date();
  }

  updatePassword(newHashedPassword: string): void {
    this._password = newHashedPassword;
    this._updated_at = new Date();
  }

  toPublicJson(): {
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
  } {
    return {
      id: this.id,
      fullname: this._fullname,
      email: this._email,
      phone: this._phone,
      google_id: this._google_id,
      profile_pic_key: this._profile_pic_key,
      is_verified: this._is_verified,
      isBlocked: this._isBlocked,
      role: this._role,
      created_at: this._created_at,
      updated_at: this._updated_at,
    };
  }
}
