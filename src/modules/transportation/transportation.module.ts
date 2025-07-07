import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transportation } from 'src/entities/transportation.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { TransportationController } from './transportation.controller';
import { TransportationService } from './transportation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transportation]), ActivityLogModule],
  controllers: [TransportationController],
  providers: [TransportationService],
  exports: [],
})
export class TransportationModule {}
