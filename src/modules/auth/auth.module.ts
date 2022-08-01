import { CacheModule, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { AnonymousStrategy, JwtStrategy } from 'src/utils/strategies';
import { ForgotPasswordModule } from '../forgot-password/forgot-password.module';
import { RedisConfigService } from 'src/config/redis-config.service';

@Module({
  imports: [
    UsersModule,
    ForgotPasswordModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.expires'),
        },
      }),
    }),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AnonymousStrategy],
  exports: [AuthService, CacheModule],
})
export class AuthModule {}
