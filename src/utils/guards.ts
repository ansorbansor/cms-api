import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ErrorMessage } from './enums';
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
        throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
      }
      return data.some(function (e) {
        if (
          !e.roleData ||
          !e.roleData.roleAccess ||
          e.roleData.roleAccess.length == 0
        ) {
          throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
        } else if (
          !e.roleData.roleAccess.some(function (x) {
            if (
              controllers == x.menu.be_controller &&
              permissions == x.menu_access
            ) {
              return true;
            }
          })
        ) {
          throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
        }
        return true;
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
      if (
        roles.filter((a) => request.user?.role.some((b) => a === b.id))
          .length <= 0
      ) {
        throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
      }
      return true;
    } else {
      if (
        request.user &&
        request.user?.role &&
        request.user?.role.length <= 0
      ) {
        throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
      }

      return true;
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
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    if (info) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
