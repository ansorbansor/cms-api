import {
  CacheModuleOptions,
  CacheOptionsFactory,
  Injectable,
} from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}
  createCacheOptions(): CacheModuleOptions {
    return {
      store: redisStore,
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      ttl: this.configService.get('redis.expiration'),
    };
  }
}
