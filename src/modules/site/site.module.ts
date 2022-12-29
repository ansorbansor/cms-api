import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from 'src/entities/site.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';

@Module({
  imports: [TypeOrmModule.forFeature([Site]), ActivityLogModule],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [],
})
export class SiteModule {}
