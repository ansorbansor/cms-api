import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisConfigService } from 'src/config/redis-config.service';
import { CourseCategory } from 'src/entities/course-category.entity';
import { CourseFetchHistory } from 'src/entities/course-fetch-history.entity';
import { CourseFetchSetting } from 'src/entities/course-fetch-setting.entity';
import { CourseLanguageTransaction } from 'src/entities/course-language-transaction.entity';
import { CourseLanguage } from 'src/entities/course-language.entity';
import { CourseLevel } from 'src/entities/course-level.entity';
import { Course } from 'src/entities/course.entity';
import { ProviderCategory } from 'src/entities/provider-category.entity';
import { TemporaryCourse } from 'src/entities/temporary-course.entity';
import { Topic } from 'src/entities/topic.entity';
import { CourseFetchController } from './course-fetch.controller';
import { CourseFetchService } from './course-fetch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProviderCategory,
      CourseFetchSetting,
      TemporaryCourse,
      CourseFetchHistory,
      CourseCategory,
      Topic,
      CourseLevel,
      CourseLanguage,
      CourseLanguageTransaction,
      Course,
    ]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [CourseFetchController],
  providers: [CourseFetchService],
  exports: [CourseFetchService],
})
export class CourseFetchModule {}
