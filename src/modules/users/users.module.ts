import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from 'src/modules/users/users.controller';
import { User } from 'src/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { UserRoles } from 'src/entities/user-role.entity';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { UserTopic } from 'src/entities/user-topic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRoles, UserTopic]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, RedisService],
  exports: [UsersService],
})
export class UsersModule {}
