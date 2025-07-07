import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { Absence } from 'src/entities/absence.entity';
import { AbsenceController } from './absence.controller';
import { AbsenceService } from './absence.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Absence]),
    ActivityLogModule,
    UsersModule,
  ],
  controllers: [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService],
})
export class AbsenceModule {}
