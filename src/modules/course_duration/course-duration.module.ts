import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseDuration } from 'src/entities/course-duration.entity';
import { CourseDurationController } from './course-duration.controller';
import { CourseDurationService } from './course-duration.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseDuration])],
  controllers: [CourseDurationController],
  providers: [CourseDurationService],
  exports: [CourseDurationService],
})
export class CourseDurationModule {}
