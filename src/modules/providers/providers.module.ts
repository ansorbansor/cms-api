import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { Provider } from 'src/entities/provider.entity';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { MailModule } from '../mail/mail.module';
import { User } from 'src/entities/user.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, User]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
    MailModule,
    ActivityLogModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService, RedisService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
