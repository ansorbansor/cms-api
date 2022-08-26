import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { CourseCategoriesController } from './course-categories.controller';
import { CourseCategoriesService } from './course-categories.service';
import { CourseCategory } from 'src/entities/course-category.entity';
import { TopicsModule } from '../topics/topics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseCategory]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
    TopicsModule,
  ],
  controllers: [CourseCategoriesController],
  providers: [CourseCategoriesService, RedisService],
  exports: [CourseCategoriesService],
})
export class CategoriesModule {}
