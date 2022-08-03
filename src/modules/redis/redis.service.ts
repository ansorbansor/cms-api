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
    // this.cacheManager.get<typeof value>(key, (err, res) => {
    //   if (redisConfig().status != 'true' || err != null) {
    //     console.log('asd1');
    //     return null;
    //   }
    //   console.log(`asd2 ${res}`);
    //   return res;
    // });
    if (redisConfig().status == 'true') {
      return this.cacheManager.get<typeof value>(key);
    }
    return null;
  }

  public del(key: string) {
    if (redisConfig().status == 'true') {
      this.cacheManager.del(key);
    }
  }
}
