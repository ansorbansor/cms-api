import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from 'src/entities/region.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { RegionController } from './region.controller';
import { RegionService } from './region.service';

@Module({
  imports: [TypeOrmModule.forFeature([Region]), ActivityLogModule],
  controllers: [RegionController],
  providers: [RegionService],
  exports: [],
})
export class RegionModule {}
