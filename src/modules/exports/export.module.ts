import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { SPK } from 'src/entities/spk.entity';
import { User } from 'src/entities/user.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Absence } from 'src/entities/absence.entity';
import { UsersModule } from '../users/users.module';
import { SPKOperational } from 'src/entities/spk-operationals.entity';
import { ExportJob } from 'src/entities/export-job.entity';

import { SiteTakeDataAssignment } from 'src/entities/site-take-data-assignment.entity';
import { WorkloadTask } from 'src/entities/workload-task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      PurchaseOrder,
      SPK,
      Absence,
      SPKOperational,
      ExportJob,
      SiteTakeDataAssignment,
      WorkloadTask,
    ]),
    ActivityLogModule,
    UsersModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule { }
