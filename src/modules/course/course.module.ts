import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { Course } from 'src/entities/course.entity';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { UserLike } from 'src/entities/user-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, UserLike]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [CourseController],
  providers: [CourseService, RedisService],
  exports: [CourseService],
})
export class CourseModule {}
