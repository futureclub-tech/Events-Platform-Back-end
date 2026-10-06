import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { PERMISSION } from "../domain/Permission.js";

export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requredPermission = this.reflector.getAllAndOverride(PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requredPermission.listen) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    return true;
  }
}
