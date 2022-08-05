import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { CourseLevel } from 'src/entities/course-level.entity';
import { CourseLevelsController } from './course-levels.controller';
import { CourseLevelsService } from './course-levels.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseLevel]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [CourseLevelsController],
  providers: [CourseLevelsService, RedisService],
  exports: [CourseLevelsService],
})
export class CourseLevelsModule {}
