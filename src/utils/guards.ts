import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from './enums';

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
      if (!data || data.length == 0) {
        return false;
      }
      return data.some(function (e) {
        if (!e.role || !e.role.roleAccess || e.role.roleAccess.length == 0) {
          return false;
        }
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

    if (request.user?.role.some((b) => RoleEnum.superadmin === b.id)) {
      return true;
    } else if (controllers && permissions) {
      return canAccess(request.user.role);
    } else {
      return (
        roles.filter((a) => request.user?.role.some((b) => a === b.id)).length >
        0
      );
    }
  }
}
