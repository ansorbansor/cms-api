import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingType } from 'src/entities/pending-type.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { PendingTypeController } from './pending-type.controller';
import { PendingTypeService } from './pending-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([PendingType]), ActivityLogModule],
  controllers: [PendingTypeController],
  providers: [PendingTypeService],
  exports: [],
})
export class PendingTypeModule {}
