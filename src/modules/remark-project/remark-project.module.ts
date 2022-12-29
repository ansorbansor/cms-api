import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemarkProject } from 'src/entities/remark-project.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { RemarkProjectController } from './remark-project.controller';
import { RemarkProjectService } from './remark-project.service';

@Module({
  imports: [TypeOrmModule.forFeature([RemarkProject]), ActivityLogModule],
  controllers: [RemarkProjectController],
  providers: [RemarkProjectService],
  exports: [],
})
export class RemarkProjectModule {}
