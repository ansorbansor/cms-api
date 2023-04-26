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
import { log } from 'console';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<number[]>('roles', [
      context.getClass(),
      context.getHandler(),
    ]);

    const menus = this.reflector.getAllAndOverride<string[]>('menus', [
      context.getClass(),
      context.getHandler(),
    ]);

    const request = context.switchToHttp().getRequest();

    const userRolesData = await getManager().query(`
      SELECT r.id, r.grant_all_access, ra.menu_access, m.name
      FROM users ur 
      LEFT JOIN employee_positions r 
      ON ur.employee_position_id = r.id
      LEFT JOIN role_access ra 
      ON ra.employee_position_id = ur.employee_position_id
      LEFT JOIN menus m
      ON ra.menu_id = m.id
      WHERE
      ur.id = ${request.user.id}
      AND r.deleted_at IS NULL
      AND ra.deleted_at IS NULL
      AND ur.deleted_at IS NULL
      AND m.deleted_at IS NULL
    `);

    const canAccess = function (data) {
      if (!data || data.length == 0) {
        throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
      }

      const hasAccess = data.some(function (e) {
        return menus.includes(e.name);
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
    if (menus) {
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
