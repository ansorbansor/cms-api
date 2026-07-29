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
//new line
import { Site } from 'src/entities/site.entity';
import { SPKOperational } from 'src/entities/spk-operationals.entity';
import { SpkGoogleSheetCronService } from './spk-googlesheet.cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SPK,
//site is new line
      Site,
      SPKInhouseTeam,
      SPKCostEvidence,
      SPKCategory,
      SPKSubCategory,
      SPKOperational,
    ]),
    ActivityLogModule,
    UsersModule,
  ],
  controllers: [SPKController],
  providers: [SPKService, SpkGoogleSheetCronService],
  exports: [SPKService],
})
export class SPKModule { }
