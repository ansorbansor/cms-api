import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from 'src/entities/area.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { AreaController } from './area.controller';
import { AreaService } from './area.service';

@Module({
  imports: [TypeOrmModule.forFeature([Area]), ActivityLogModule],
  controllers: [AreaController],
  providers: [AreaService],
  exports: [],
})
export class AreaModule {}
