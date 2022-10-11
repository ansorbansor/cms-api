import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { UserNotification } from 'src/entities/user-notification.entity';
import { UserNotificationController } from './user-notification.controller';
import { UserNotificationService } from './user-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserNotification]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [UserNotificationController],
  providers: [UserNotificationService, RedisService],
  exports: [UserNotificationService],
})
export class UserNotificationModule {}
