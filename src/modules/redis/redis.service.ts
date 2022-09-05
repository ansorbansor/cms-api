import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import redisConfig from 'src/config/redis.config';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public set(key: string, value: any) {
    if (redisConfig().status == 'true') {
      this.cacheManager.set<typeof value>(key, value);
    }
  }

  public async get(key: string, value: any) {
    if (redisConfig().status == 'true') {
      return this.cacheManager.get<typeof value>(key) as typeof value;
    }
    return null;
  }

  public async del(key: string) {
    if (redisConfig().status == 'true') {
      const keys = await this.cacheManager.store.keys(`*${key}*`);
      await this.cacheManager.store.del(keys);
    }
  }
}
