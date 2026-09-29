import { IsMobilePhone, IsString, Length } from "class-validator";

export class LoginUserRequestDTO {
  @IsMobilePhone("en-IN")
  @Length(10)
  phone: string;

  @IsString()
  password: string;
}
