import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OauthClient } from 'src/entities/oauth-client.entity';
import { UserCourse } from 'src/entities/user-course.entity';
import { User } from 'src/entities/user.entity';
import { ClientStrategy } from 'src/utils/strategies';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { OauthClientService } from '../oauth_client/oauth-client.service';
import { UserNotificationModule } from '../user-notification/user-notification.module';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCourse, User, OauthClient]),
    ActivityLogModule,
    UserNotificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
      }),
    }),
  ],
  controllers: [PartnerController],
  providers: [
    PartnerService,
    OauthClientService,
    ClientStrategy,
    ConfigService,
  ],
  exports: [PartnerService],
})
export class PartnerModule {}
