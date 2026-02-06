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
                qb.where('acl.description ILIKE :poKey', { poKey: '% PO %' })
                    .orWhere('acl.description ILIKE :purchaseOrderKey', { purchaseOrderKey: '%Purchase Order%' });
            }))
            .orderBy('user.name', 'ASC')
            .addOrderBy('acl.created_at', 'ASC')
            .getMany();

        if (logs.length === 0) {
            this.logger.log('No logs found for the period.');
            await this.sendTelegramMessage(this.generateEmptyReport(startDate, endDate));
            return;
        }

        const messages = this.generateReportChunks(logs, startDate, endDate);

        this.logger.log(`Report generated. Sending ${messages.length} chunks.`);

        for (const [index, msg] of messages.entries()) {
            this.logger.log(`Sending chunk ${index + 1}/${messages.length}`);
            await this.sendTelegramMessage(msg);
        }
    }

    private generateEmptyReport(startDate: moment.Moment, endDate: moment.Moment): string {
        return `📊 **Laporan Aktivitas PO Harian**\n` +
            `📅 Periode: ${startDate.format('YYYY-MM-DD HH:mm')} - ${endDate.format('YYYY-MM-DD HH:mm')}\n\n` +
            `✨ Total Aktivitas: 0`;
    }

    private generateReportChunks(logs: ActivityLog[], startDate: moment.Moment, endDate: moment.Moment): string[] {
        const header = `📊 **Laporan Aktivitas PO Harian**\n` +
            `📅 Periode: ${startDate.format('YYYY-MM-DD HH:mm')} - ${endDate.format('YYYY-MM-DD HH:mm')}\n\n`;

        const chunks: string[] = [];
        let currentChunk = header;
        const MAX_LENGTH = 4000; // Safe limit below 4096

        const groupedLogs: { [key: string]: ActivityLog[] } = {};

        logs.forEach(log => {
            const userName = log.user ? log.user.name : 'Unknown User';
            if (!groupedLogs[userName]) {
                groupedLogs[userName] = [];
            }
            groupedLogs[userName].push(log);
        });

        for (const user in groupedLogs) {
            let userSection = `👤 **${user}**\n`;

            // If user header alone pushes over limit, push current chunk
            if (currentChunk.length + userSection.length > MAX_LENGTH) {
                chunks.push(currentChunk);
                currentChunk = header + `(Continued)\n\n` + userSection; // Start new chunk with header
            } else {
                currentChunk += userSection;
            }

            const userLogs = groupedLogs[user];
            let previousLogLine = '';
            let repeatCount = 1;

            userLogs.forEach((log, index) => {
                const time = moment(log.created_at).utcOffset(7).format('HH:mm');
                const cleanDescription = log.description.trim();
                const logLine = `• [${time}] ${cleanDescription}`;

                const isLastLog = index === userLogs.length - 1;
                const nextLog = !isLastLog ? userLogs[index + 1] : null;

                // Check ahead for duplicates
                if (nextLog) {
                    const nextTime = moment(nextLog.created_at).utcOffset(7).format('HH:mm');
                    const nextDescription = nextLog.description.trim();
                    const nextLogLine = `• [${nextTime}] ${nextDescription}`;

                    if (nextLogLine === logLine) {
                        repeatCount++;
                        return; // Skip adding this line, wait for the last duplicate
                    }
                }

                // Construct final line with count if needed
                let finalLine = logLine;
                if (repeatCount > 1) {
                    finalLine += ` (x${repeatCount})`;
                }
                finalLine += `\n`;

                // Reset count
                repeatCount = 1;

                if (currentChunk.length + finalLine.length > MAX_LENGTH) {
                    chunks.push(currentChunk);
                    currentChunk = header + `(Continued)\n\n👤 **${user}** (Cont.)\n` + finalLine;
                } else {
                    currentChunk += finalLine;
                }
            });

            // Add spacing between users if room permits
            if (currentChunk.length + 1 < MAX_LENGTH) {
                currentChunk += `\n`;
            }
        }

        const footer = `✨ Total Aktivitas: ${logs.length}`;
        if (currentChunk.length + footer.length > MAX_LENGTH) {
            chunks.push(currentChunk);
            chunks.push(header + `(Continued)\n\n` + footer);
        } else {
            currentChunk += footer;
            chunks.push(currentChunk);
        }

        return chunks;
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
