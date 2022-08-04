import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { Provider } from 'src/entities/provider.entity';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService, RedisService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
