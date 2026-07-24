import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { Absence } from 'src/entities/absence.entity';
import { AbsenceController } from './absence.controller';
import { AbsenceService } from './absence.service';
import { AbsenceCronService } from './absence.cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Absence]),
    ActivityLogModule,
    UsersModule,
    WhatsappModule,
  ],
  controllers: [AbsenceController],
  providers: [AbsenceService, AbsenceCronService],
  exports: [AbsenceService],
})
export class AbsenceModule {}
