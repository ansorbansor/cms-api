import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { failedResponse } from './responses';

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
        if (
          !e.roleData ||
          !e.roleData.roleAccess ||
          e.roleData.roleAccess.length == 0
        ) {
          return false;
        }
        return e.roleData.roleAccess.some(function (x) {
          if (
            controllers == x.menu.be_controller &&
            permissions == x.menu_access
          ) {
            return true;
          }
        });
      });
    };

    if (
      request.user &&
      request.user.role &&
      request.user.role.some((b) => b.roleData && b.roleData.grant_all_access)
    ) {
      return true;
    }
    if (controllers && permissions) {
      return canAccess(request.user.role);
    } else if (roles) {
      return (
        roles.filter((a) => request.user?.role.some((b) => a === b.id)).length >
        0
      );
    } else {
      return (
        request.user && request.user?.role && request.user?.role.length > 0
      );
    }
  }
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): void {
    throw failedResponse(
      HttpStatus.TOO_MANY_REQUESTS,
      'Terlalu banyak permintaan',
    );
  }
}
