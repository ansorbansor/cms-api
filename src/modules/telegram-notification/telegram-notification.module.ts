import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from 'src/entities/activity-log.entity';
import { TelegramNotificationService } from './telegram-notification.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([ActivityLog]),
        ActivityLogModule,
    ],
    providers: [TelegramNotificationService],
    exports: [TelegramNotificationService],
})
export class TelegramNotificationModule { }
