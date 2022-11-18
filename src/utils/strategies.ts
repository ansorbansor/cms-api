import { ExtractJwt, Strategy } from 'passport-jwt';
import { Strategy as AnonStrategy } from 'passport-anonymous';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { failedResponse } from './responses';
import { decryptText } from './encryption-helper';
import { OauthClientService } from 'src/modules/oauth_client/oauth-client.service';
import { ErrorMessage } from './enums';

type JwtPayload = Pick<User, 'id'> & { iat: number; exp: number };
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret'),
    });
  }

  public async validate(payload: JwtPayload) {
    if (!payload.id) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.FORBIDDEN);
    }

    payload.id = Number(await decryptText(payload.id));

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

@Injectable()
export class ClientStrategy extends PassportStrategy(Strategy) {
  constructor(
    private oauthClientService: OauthClientService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret'),
    });
  }

  public async validate(payload: any): Promise<any> {
    if (!payload || !payload.client_id || !payload.client_secret) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.FORBIDDEN);
    }

    return await this.oauthClientService.validateClient(
      Number(await decryptText(payload.client_id)),
      await decryptText(payload.client_secret),
    );
  }
}
