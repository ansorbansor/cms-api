import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { decryptText } from './encryption-helper';
import { ErrorMessage } from './enums';
import { failedResponse } from './responses';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const decryptPayload = [];

    for (const e of request.user.role) {
      decryptPayload.push({
        roleData: {
          id: await decryptText(e.roleData.id),
          grant_all_access: await decryptText(e.roleData.grant_all_access),
          roleAccess: await Promise.all(
            e.roleData.roleAccess.map(async (roleAccess) => {
              return {
                be_controller: await decryptText(roleAccess.be_controller),
                menu_access: await decryptText(roleAccess.menu_access),
              };
            }),
          ),
        },
      });
    }

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
              controllers == x.be_controller &&
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
      decryptPayload.some(
        (b) => b.roleData && b.roleData.grant_all_access == 'true',
      )
    ) {
      return true;
    }
    if (controllers && permissions) {
      return canAccess(decryptPayload);
    } else if (roles) {
      if (
        roles.filter((a) => decryptPayload.some((b) => a === b.roleData.id))
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
@Injectable()
export class ClientAuthGuard extends AuthGuard('partnetStrategy') {
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    if (info) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
