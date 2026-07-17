import { ExtractJwt, Strategy } from 'passport-jwt';
import { Strategy as AnonStrategy } from 'passport-anonymous';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { failedResponse } from './responses';
import { decryptText } from './encryption-helper';
import { ErrorMessage } from './enums';
import { AuthService } from 'src/modules/auth/auth.service';

type JwtPayload = Pick<User, 'id'> & { iat: number; exp: number };
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService, configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          return req?.query?.token;
        },
      ]),
      secretOrKey: configService.get('auth.secret'),
      passReqToCallback: true,
    });
  }

  public async validate(req: Request, payload: JwtPayload & { appSessionId?: string }) {
    payload.id = Number(await decryptText(payload.id as any));

    if (!payload.id) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.FORBIDDEN);
    }

    if (payload.appSessionId) {
      const user = await this.authService.me({ id: payload.id } as User);
      if (user && user.app_session_id !== payload.appSessionId) {
        throw failedResponse(HttpStatus.UNAUTHORIZED, 'Session anda telah habis karena akun telah login di perangkat lain.');
      }
    }

    return payload;
  }
}

@Injectable()
export class AnonymousStrategy extends PassportStrategy(AnonStrategy) {
  constructor() {
    super();
  }

  public validate(payload: unknown, request: unknown): unknown {
    return request;
  }
}
