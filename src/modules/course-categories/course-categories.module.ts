import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { Category } from 'src/entities/category.entity';
import { CourseCategoriesController } from './course-categories.controller';
import { CourseCategoriesService } from './course-categories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [CourseCategoriesController],
  providers: [CourseCategoriesService, RedisService],
  exports: [CourseCategoriesService],
})
export class CategoriesModule {}
