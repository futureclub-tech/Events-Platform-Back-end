import { IsString, Length } from "class-validator";

export class VerifyOTPRequestDTO {
  @IsString()
  @Length(10)
  phone: string;

  @IsString()
  @Length(6)
  otp: string;
}

export class ResendOTPRequestDTO {
  @IsString()
  @Length(10)
  phone: string;
}
