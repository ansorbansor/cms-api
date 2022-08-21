import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<number[]>('roles', [
      context.getClass(),
      context.getHandler(),
    ]);

    const controllers = this.reflector.getAllAndOverride<string[]>(
      'controllers',
      [context.getClass(), context.getHandler()],
    );

    const permissions = this.reflector.getAllAndOverride<number[]>(
      'permissions',
      [context.getClass(), context.getHandler()],
    );

    const request = context.switchToHttp().getRequest();

    const canAccess = function (data) {
      return data.some(function (e) {
        return e.role.roleAccess.some(function (x) {
          if (
            controllers == x.menu.be_controller &&
            permissions == x.menu_access
          ) {
            return true;
          }
        });
      });
    };

    if (controllers && permissions) {
      return canAccess(request.user.role);
    } else {
      return (
        roles.filter((a) => request.user?.role.some((b) => a === b.id)).length >
        0
      );
    }
  }
}
