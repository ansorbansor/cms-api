import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import moment from 'moment';
import { ActivityLog } from 'src/entities/activity-log.entity';
import { Brackets, Repository, Between } from 'typeorm';

@Injectable()
export class TelegramNotificationService {
    private readonly logger = new Logger(TelegramNotificationService.name);
    private readonly telegramToken = '8577479806:AAGqFajmWZSKOPXREvH7yr94dXky7IfSe3g';
    private readonly chatId = '1182015942';

    constructor(
        @InjectRepository(ActivityLog)
        private activityLogRepository: Repository<ActivityLog>,
    ) { }

    @Cron('0 * * * *', {
        name: 'sendHourlyPOLogs',
        timeZone: 'Asia/Jakarta',
    })
    async handleCron() {
        this.logger.log('Starting hourly PO Log Telegram notification task...');

        // Calculate time range: Cumulative from last 20:00 WIB
        // Cycle is 20:00 (Previous Day) to 20:00 (Today).
        // If 20:00 -> Finalize previous cycle (Yesterday 20:00 to Today 20:00).
        // If > 20:00 -> Start new cycle (Today 20:00 to Now).
        // If < 20:00 -> Continue cycle (Yesterday 20:00 to Now).
        const now = moment().utcOffset(7);
        const currentHour = now.hour();

        const startDate = (currentHour > 20)
            ? moment().utcOffset(7).set({ hour: 20, minute: 0, second: 0, millisecond: 0 })
            : moment().utcOffset(7).subtract(1, 'days').set({ hour: 20, minute: 0, second: 0, millisecond: 0 });

        const endDate = moment().utcOffset(7);

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

        if (logs.length > 0) {
            const messages = this.generateReportChunks(logs, startDate, endDate);

            this.logger.log(`Report generated. Sending ${messages.length} chunks.`);

            for (const [index, msg] of messages.entries()) {
                this.logger.log(`Sending chunk ${index + 1}/${messages.length}`);
                await this.sendTelegramMessage(msg);
            }
        } else {
            this.logger.log('No logs found for the period.');
        }

        // Lock removed as requested. All instances will send reports.
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
        const MAX_LENGTH = 4000;

        const groupedLogs: { [key: string]: Set<string> } = {};

        logs.forEach(log => {
            const userName = log.user ? log.user.name : 'Unknown User';
            if (!groupedLogs[userName]) {
                groupedLogs[userName] = new Set();
            }

            // Extract ID: usually the last part of the message
            // "Updated Column ... on PO 2026BSN-..."
            // "Menambahkan data PO dengan nomor 2026BSN-..."
            // "update PO ..." (from my regex earlier? No, this runs on raw DB data usually unless I changed what's stored. 
            // Wait, the DB stores the full string. My previous edit didn't change DB data, only the *display* in the report.
            // So I should parse the RAW description from DB.)

            const parts = log.description.trim().split(' ');
            const potentialId = parts[parts.length - 1];

            // Validate ID: 
            // If ID is missing ('-'), we still include it.
            // User asked "what is - mean??" but also "we should report it". 
            // So we report exactly what we find.
            if (potentialId) {
                groupedLogs[userName].add(potentialId);
            }
        });

        // let totalUniquePOs = 0; // This variable is no longer used based on the instruction's changes.

        for (const user in groupedLogs) {
            const uniqueIds = Array.from(groupedLogs[user]);

            // Skip only if truly empty (shouldn't happen with the logic above)
            if (uniqueIds.length === 0) continue;

            let userSection = `👤 **${user}** updated ${uniqueIds.length} PO\n`;

            // Check if header fits
            if (currentChunk.length + userSection.length > MAX_LENGTH) {
                chunks.push(currentChunk);
                currentChunk = header + `(Continued)\n\n` + userSection;
            } else {
                currentChunk += userSection;
            }

            uniqueIds.forEach(id => {
                const line = `${id}\n`;
                if (currentChunk.length + line.length > MAX_LENGTH) {
                    chunks.push(currentChunk);
                    currentChunk = header + `(Continued)\n\n👤 **${user}** (Cont.)\n` + line;
                } else {
                    currentChunk += line;
                }
            });

            if (currentChunk.length + 1 < MAX_LENGTH) {
                currentChunk += `\n`;
            }
        }

        // footer
        // "Total Activities" doesn't make sense with unique POs. 
        // Maybe "Total Unique POs modified"? Or just remove total? 
        // User sample didn't explicitly show total, but I'll add "Total Unique POs" or similar.
        // Actually user sample didn't have total line in the "show me sample" request before, it had. 
        // I'll leave a simple total or omit it if strictly following "I just need report like this".
        // The user's block ended with "same BIOSRON ID doesnt reported again...". No total line shown in that block.
        // BUT, looking closely at the requested text block:
        // "👤 Dede Ansor updated 2 PO ... 👤 Ardian updated 1 PO ..."
        // I will omit the footer to be safe or just show Total: X
        // I'll stick to the requested format strictly.

        // Push the final chunk if it contains more than just the header
        if (currentChunk.length > header.length) {
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
