import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getManager } from 'typeorm';
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

    const userRolesData = await getManager().query(`
      SELECT r.id, r.grant_all_access, ra.menu_access, m.be_controller
      FROM user_roles ur 
      LEFT JOIN roles r 
      ON ur.role_id = r.id
      LEFT JOIN role_access ra 
      ON ra.role_id = r.id
      LEFT JOIN menus m
      ON ra.menu_id = m.id
      WHERE
      ur.user_id = ${request.user.id}
    `);

    const canAccess = function (data) {
      if (!data || data.length == 0) {
        throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
      }
      const hasAccess = data.some(function (e) {
        return controllers == e.be_controller && permissions == e.menu_access;
      });

      if (!hasAccess) {
        throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
      }

      return true;
    };

    if (
      request.user &&
      userRolesData.some((b) => b && b.grant_all_access == 1)
    ) {
      return true;
    }
    if (controllers && permissions) {
      return canAccess(userRolesData);
    } else if (roles) {
      if (
        roles.filter((a) => userRolesData.some((b) => a === b.id)).length <= 0
      ) {
        throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
      }
      return true;
    } else {
      if (request.user && userRolesData.length <= 0) {
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
export class ClientAuthGuard extends AuthGuard('clientStrategy') {
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    if (info) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
