import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { FilesModule } from '../files/files.module';
import { Absence } from 'src/entities/absence.entity';
import { LeaveQuota } from 'src/entities/leave-quota.entity';
import { AbsenceController } from './absence.controller';
import { AbsenceService } from './absence.service';
import { AbsenceCronService } from './absence.cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Absence, LeaveQuota]),
    ActivityLogModule,
    UsersModule,
    WhatsappModule,
    FilesModule,
  ],
  controllers: [AbsenceController],
  providers: [AbsenceService, AbsenceCronService],
  exports: [AbsenceService],
})
export class AbsenceModule {}
