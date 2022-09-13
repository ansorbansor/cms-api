import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { BlacklistController } from './user-blacklists.controller';
import { UserRoles } from 'src/entities/user-role.entity';
import { UserTopic } from 'src/entities/user-topic.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRoles, UserTopic]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
    MailModule,
  ],
  controllers: [BlacklistController],
  providers: [UsersService, RedisService],
  exports: [UsersService],
})
export class UserBlacklistsModule {}
