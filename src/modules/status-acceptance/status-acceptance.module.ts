import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusAcceptance } from 'src/entities/status-acceptance.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { StatusAcceptanceController } from './status-acceptance.controller';
import { StatusAcceptanceService } from './status-acceptance.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatusAcceptance]), ActivityLogModule],
  controllers: [StatusAcceptanceController],
  providers: [StatusAcceptanceService],
  exports: [],
})
export class StatusAcceptanceModule {}
