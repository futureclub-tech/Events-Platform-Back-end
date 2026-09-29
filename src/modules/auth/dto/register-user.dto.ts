import { IsString, Length } from "class-validator";

export class RegisterUserRequestDTO {
  @IsString()
  @Length(4)
  fullName: string;

  @IsString()
  @Length(10)
  phone: string;

  @IsString()
  password: string;
}
