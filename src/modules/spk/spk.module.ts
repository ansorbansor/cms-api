import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SPKCostEvidence } from 'src/entities/spk-cost-evidence.entity';
import { SPKInhouseTeam } from 'src/entities/spk-inhouse-team.entity';
import { SPK } from 'src/entities/spk.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { SPKController } from './spk.controller';
import { SPKService } from './spk.service';
import { SPKCategory } from 'src/entities/spk-category.entity';
import { SPKSubCategory } from 'src/entities/spk-subcategory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SPK,
      SPKInhouseTeam,
      SPKCostEvidence,
      SPKCategory,
      SPKSubCategory,
    ]),
    ActivityLogModule,
    UsersModule,
  ],
  controllers: [SPKController],
  providers: [SPKService],
  exports: [SPKService],
})
export class SPKModule { }
