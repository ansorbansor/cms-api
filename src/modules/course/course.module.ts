import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { Course } from 'src/entities/course.entity';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { UserLike } from 'src/entities/user-like.entity';
import { CourseLanguageTransaction } from 'src/entities/course-language-transaction.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, UserLike, CourseLanguageTransaction]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
    ActivityLogModule,
  ],
  controllers: [CourseController],
  providers: [CourseService, RedisService],
  exports: [CourseService],
})
export class CourseModule {}
