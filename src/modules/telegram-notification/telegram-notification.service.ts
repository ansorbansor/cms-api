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

    @Cron('0 20 * * *', {
        name: 'sendDailyPOLogs',
        timeZone: 'Asia/Jakarta',
    })
    async handleCron() {
        // Rate limiting/Concurrency control:
        // We see 6 instances running (PIDs 31, 37, 43, 51, 58, 65).
        // To prevent race conditions where they all check DB at the same millisecond and succeed,
        // we add a random delay (jitter) of 0-60 seconds.
        const randomDelay = Math.floor(Math.random() * 60000);
        this.logger.log(`Waiting ${randomDelay}ms before starting daily PO Log task to prevent duplicate sending...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        this.logger.log('Starting daily PO Log Telegram notification task...');

        // Calculate time range: Yesterday 20:00 to Today 19:59 (Asia/Jakarta is UTC+7)
        const endDate = moment().utcOffset(7).set({ hour: 19, minute: 59, second: 59, millisecond: 999 });
        const startDate = moment().utcOffset(7).subtract(1, 'days').set({ hour: 20, minute: 0, second: 0, millisecond: 0 });

        // Idempotency Check: Prevent duplicate sending if multiple instances are running
        const sentLog = await this.activityLogRepository.findOne({
            where: {
                description: 'TELEGRAM_DAILY_REPORT_SENT_V2',
                created_at: Between(startDate.toDate(), endDate.toDate())
            }
        });

        if (sentLog) {
            this.logger.warn('Daily report already sent for this period (found lock). Skipping.');
            return;
        }

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
            // Optional: Send "No Activity" message? User wants simple report. 
            // If no logs, silence is usually preferred or a simple "No updates".
            // Given user complaints about duplicates, silence on empty is safer.
        }

        // Mark as sent
        // Using user_id: 1 (System/Admin) or the first available user from logs if possible.
        // If no user 1, this might fail. Safest is to try/catch.
        try {
            await this.activityLogRepository.save(this.activityLogRepository.create({
                user_id: 1, // Assuming ID 1 is always present (Super Admin)
                description: 'TELEGRAM_DAILY_REPORT_SENT_V2',
                ip: '127.0.0.1'
            }));
        } catch (e) {
            this.logger.error('Failed to save sent marker', e);
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
