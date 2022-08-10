import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { CoursePrice } from 'src/entities/course-price.entity';
import { CoursePriceController } from './course-price.controller';
import { CoursePriceService } from './course-price.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoursePrice]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [CoursePriceController],
  providers: [CoursePriceService, RedisService],
  exports: [CoursePriceService],
})
export class CoursePriceModule {}
