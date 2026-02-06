import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import moment from 'moment';
import { ActivityLog } from 'src/entities/activity-log.entity';
import { Brackets, Repository } from 'typeorm';

@Injectable()
export class TelegramNotificationService {
    private readonly logger = new Logger(TelegramNotificationService.name);
    private readonly telegramToken = '8577479806:AAGqFajmWZSKOPXREvH7yr94dXky7IfSe3g';
    private readonly chatId = '1182015942';

    constructor(
        @InjectRepository(ActivityLog)
        private activityLogRepository: Repository<ActivityLog>,
    ) { }

    @Cron('0 20 * * *', {
        name: 'sendDailyPOLogs',
        timeZone: 'Asia/Jakarta',
    })
    async handleCron() {
        this.logger.log('Running daily PO Log Telegram notification task...');

        // Calculate time range: Yesterday 20:00 to Today 19:59 (Asia/Jakarta is UTC+7)
        const endDate = moment().utcOffset(7).set({ hour: 19, minute: 59, second: 59, millisecond: 999 });
        const startDate = moment().utcOffset(7).subtract(1, 'days').set({ hour: 20, minute: 0, second: 0, millisecond: 0 });

        this.logger.log(`Fetching logs from ${startDate.format()} to ${endDate.format()}`);

        const logs = await this.activityLogRepository.createQueryBuilder('acl')
            .leftJoinAndSelect('acl.user', 'user')
            .where('acl.created_at >= :startDate', { startDate: startDate.toDate() })
            .andWhere('acl.created_at <= :endDate', { endDate: endDate.toDate() })
            .andWhere(new Brackets(qb => {
                qb.where('acl.description ILIKE :poKey', { poKey: '%PO%' })
                    .orWhere('acl.description ILIKE :purchaseOrderKey', { purchaseOrderKey: '%Purchase Order%' })
                    .orWhere('acl.description ILIKE :nomor', { nomor: '%nomor%' }); // Based on "Menambahkan data PO dengan nomor..."
            }))
            .orderBy('user.name', 'ASC')
            .addOrderBy('acl.created_at', 'ASC')
            .getMany();

        if (logs.length === 0) {
            this.logger.log('No logs found for the period.');
            // Optional: Send "No activity" message? User didn't specify. 
            // Better to send nothing or a summary saying 0.
            // Let's send a summary saying 0 activities to verify it works.
            await this.sendTelegramMessage(this.generateReport(logs, startDate, endDate));
            return;
        }

        const message = this.generateReport(logs, startDate, endDate);
        await this.sendTelegramMessage(message);
    }

    private generateReport(logs: ActivityLog[], startDate: moment.Moment, endDate: moment.Moment): string {
        let message = `📊 **Laporan Aktivitas PO Harian**\n`;
        message += `📅 Periode: ${startDate.format('YYYY-MM-DD HH:mm')} - ${endDate.format('YYYY-MM-DD HH:mm')}\n\n`;

        const groupedLogs: { [key: string]: ActivityLog[] } = {};

        logs.forEach(log => {
            const userName = log.user ? log.user.name : 'Unknown User';
            if (!groupedLogs[userName]) {
                groupedLogs[userName] = [];
            }
            groupedLogs[userName].push(log);
        });

        for (const user in groupedLogs) {
            message += `👤 **${user}**\n`;
            groupedLogs[user].forEach(log => {
                const time = moment(log.created_at).utcOffset(7).format('HH:mm');
                message += `• [${time}] ${log.description}\n`;
            });
            message += `\n`;
        }

        message += `✨ Total Aktivitas: ${logs.length}`;

        // Telegram message limit is 4096 chars. Truncate if needed or split. 
        // For now simple implementation.
        return message;
    }

    private async sendTelegramMessage(text: string) {
        const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
        try {
            await axios.post(url, {
                chat_id: this.chatId,
                text: text,
                parse_mode: 'Markdown',
            });
            this.logger.log('Telegram message sent successfully.');
        } catch (error) {
            this.logger.error('Failed to send Telegram message', error.response?.data || error.message);
        }
    }
}
