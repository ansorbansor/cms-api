import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SPKInhouseTeam } from 'src/entities/spk-inhouse-team.entity';
import { SPK } from 'src/entities/spk.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { SPKController } from './spk.controller';
import { SPKService } from './spk.service';

@Module({
  imports: [TypeOrmModule.forFeature([SPK, SPKInhouseTeam]), ActivityLogModule],
  controllers: [SPKController],
  providers: [SPKService],
  exports: [SPKService],
})
export class SPKModule {}
