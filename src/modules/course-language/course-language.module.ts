import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { RedisConfigService } from 'src/config/redis-config.service';
import { CourseLanguage } from 'src/entities/course-language.entity';
import { CourseLanguageController } from './course-language.controller';
import { CourseLanguageService } from './course-language.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseLanguage]),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [CourseLanguageController],
  providers: [CourseLanguageService, RedisService],
  exports: [CourseLanguageService],
})
export class CourseLanguageModule {}
