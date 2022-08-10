import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { CourseRatingController } from './course-rating.controller';
import { CourseRatingService } from './course-rating.service';
import { CourseRating } from 'src/entities/course-rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseRating]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [CourseRatingController],
  providers: [CourseRatingService, RedisService],
  exports: [CourseRatingService],
})
export class CourseRatingModule {}
