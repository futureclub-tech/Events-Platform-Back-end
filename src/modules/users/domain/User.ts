export type UserData = {
  id: string;
  fullName: string;
  phone: string;
  passwordHash: string | null;
  isVerified: boolean;
};

export class User {
  constructor(
    readonly id: string,
    readonly fullName: string,
    readonly phone: string,
    readonly passwordHash: string | null,
    readonly isVerified: boolean,
  ) {}
}
