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
import { RedisService } from '../redis/redis.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from 'src/entities/menu.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Menu,
      EmployeePosition,
      EmployeeLevel,
      EmployeeUnit,
      User,
    ]),
    UsersModule,
    ForgotPasswordModule,
    PassportModule,
    MailModule,
    ActivityLogModule,
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
  providers: [AuthService, JwtStrategy, AnonymousStrategy, RedisService],
  exports: [AuthService],
})
export class AuthModule {}
