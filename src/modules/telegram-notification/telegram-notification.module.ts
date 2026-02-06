import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramNotificationService } from './telegram-notification.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ActivityLogModule,
    ],
    providers: [TelegramNotificationService],
    exports: [TelegramNotificationService],
})
export class TelegramNotificationModule { }
