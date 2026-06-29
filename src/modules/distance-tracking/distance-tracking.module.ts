import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistanceTrackingService } from './distance-tracking.service';
import { DistanceTrackingController } from './distance-tracking.controller';
import { DistanceTracking } from './entities/distance-tracking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DistanceTracking])],
  controllers: [DistanceTrackingController],
  providers: [DistanceTrackingService],
})
export class DistanceTrackingModule {}
