import { Module } from '@nestjs/common';
import { AuthenticationController } from './controller/authentication/authentication.controller.js';
import { Controller } from './controller/.controller.js';
import { AuthControllerTsController } from './controller/auth.controller.ts/auth.controller.ts.controller.js';
import { AuthController } from './controller/auth.controller.js';
import { AuthService } from './service/auth.service.js';

@Module({
  controllers: [AuthenticationController, Controller, AuthControllerTsController, AuthController],
  providers: [AuthService]
})
export class AuthModule {}
