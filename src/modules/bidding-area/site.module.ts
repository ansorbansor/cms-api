import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiddingArea } from 'src/entities/bidding_area.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { BiddingAreaController } from './bidding-area.controller';
import { BiddingAreaService } from './bidding-area.service';

@Module({
  imports: [TypeOrmModule.forFeature([BiddingArea]), ActivityLogModule],
  controllers: [BiddingAreaController],
  providers: [BiddingAreaService],
  exports: [],
})
export class BiddingAreaModule {}
