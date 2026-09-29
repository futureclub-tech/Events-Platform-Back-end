import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "../service/auth.service.js";
import { Public } from "../decorators/public.decorator.js";
import { RegisterUserRequestDTO } from "../dto/register-user.dto.js";
import { LoginUserRequestDTO } from "../dto/login-user.dto.js";
import { RESPONSE_MESSAGE } from "../../../shared/enum/response-message.enum.js";
import { ResponseMessage } from "../../../shared/decorator/response-message.decorator.js";
import { ResendOTPRequestDTO, VerifyOTPRequestDTO } from "../dto/otp.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ResponseMessage(RESPONSE_MESSAGE.REGISTRATION_SUCCESS)
  register(
    @Body()
    body: RegisterUserRequestDTO,
  ) {
    return this.authService.register(body);
  }

  @Public()
  @Post("login")
  login(
    @Body()
    body: LoginUserRequestDTO,
  ) {
    return this.authService.login(body);
  }

  @Public()
  @Post("verify-otp")
  @ResponseMessage(RESPONSE_MESSAGE.OTP_VERIFIED)
  verifyOtp(@Body() body: VerifyOTPRequestDTO) {
    return this.authService.verifyOtp(body);
  }

  @Public()
  @Post("resend-otp")
  @ResponseMessage(RESPONSE_MESSAGE.OTP_RESEND_SUCCESS)
  resendOtp(@Body() body: ResendOTPRequestDTO) {
    return this.authService.resendOtp(body);
  }
}
