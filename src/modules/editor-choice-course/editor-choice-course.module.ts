import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { EditorChoiceCourseController } from './editor-choice-course.controller';
import { EditorChoiceCourseService } from './editor-choice-course.service';
import { EditorChoiceCourse } from 'src/entities/editor-choice-course.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EditorChoiceCourse]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
    ActivityLogModule,
  ],
  controllers: [EditorChoiceCourseController],
  providers: [EditorChoiceCourseService, RedisService],
  exports: [EditorChoiceCourseService],
})
export class EditorChoiceCourseModule {}
