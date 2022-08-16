import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { Banner } from 'src/entities/banner.entity';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';
import { Course } from 'src/entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner, Course]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [BannerController],
  providers: [BannerService, RedisService],
  exports: [BannerService],
})
export class BannerModule {}
