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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret'),
      passReqToCallback: true,
    });
  }

  public async validate(req: Request, payload: JwtPayload) {
    payload.id = Number(await decryptText(payload.id));

    if (!payload.id) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.FORBIDDEN);
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
