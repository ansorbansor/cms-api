import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { SPKOperationalController } from './spk-operational.controller';
import { SPKOperationalService } from './spk-operational.service';
import { SPKOperational } from 'src/entities/spk-operationals.entity';
import { SPKOperationalInhouseTeam } from 'src/entities/spk-operational-inhouse-team.entity';
import { SPKOperationalCostEvidence } from 'src/entities/spk-operationals.cost-evidence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SPKOperational,
      SPKOperationalInhouseTeam,
      SPKOperationalCostEvidence,
    ]),
    ActivityLogModule,
    UsersModule,
  ],
  controllers: [SPKOperationalController],
  providers: [SPKOperationalService],
  exports: [SPKOperationalService],
})
export class SPKOperationalModule {}
