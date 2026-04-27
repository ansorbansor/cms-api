import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkloadTask } from 'src/entities/workload-task.entity';
import { getFlag } from 'src/utils/feature-flags.util';
import { WhatsappService } from 'src/modules/whatsapp/whatsapp.service';
import moment from 'moment';

@Injectable()
export class WorkloadTicketsCronService {
  private readonly logger = new Logger(WorkloadTicketsCronService.name);

  constructor(
    @InjectRepository(WorkloadTask)
    private readonly taskRepo: Repository<WorkloadTask>,
    private readonly whatsappService: WhatsappService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDailyNotifications() {
    const isEnabled = getFlag('enable_daily_reminder', true);
    if (!isEnabled) return;

    const scheduledTime = getFlag('daily_reminder_time', '08:00');
    const currentTime = moment().format('HH:mm');

    if (currentTime !== scheduledTime) {
      return;
    }

    this.logger.log(`Triggering daily notifications for Workload Tasks at ${currentTime}`);

    try {
      // Find all tasks that are 'In Progress' with their assigned user
      const inProgressTasks = await this.taskRepo.find({
        where: { status: 'In Progress' },
        relations: ['assigned_to_user', 'milestone', 'milestone.workload_ticket', 'milestone.workload_ticket.site']
      });

      if (inProgressTasks.length === 0) {
        return;
      }

      // Group by user ID
      const tasksByUser: Record<number, WorkloadTask[]> = {};
      for (const task of inProgressTasks) {
        if (!task.assigned_to_user || !task.assigned_to_user.phone) continue;
        
        const userId = task.assigned_to_user.id;
        if (!tasksByUser[userId]) {
          tasksByUser[userId] = [];
        }
        tasksByUser[userId].push(task);
      }

      // Send a WhatsApp message for each group
      const CHUNK_SIZE = 10;
      for (const [userId, tasks] of Object.entries(tasksByUser)) {
        const user = tasks[0].assigned_to_user;
        const totalTasks = tasks.length;
        
        let headerMessage = `Hai ${user.name}! 🔔\n\nIni adalah pengingat harian. Anda memiliki *${totalTasks} tugas* berstatus In Progress yang belum diselesaikan:\n\n`;
        let currentMessage = headerMessage;
        
        for (let i = 0; i < tasks.length; i++) {
          const t = tasks[i];
          const site = t.milestone?.workload_ticket?.site;
          const siteText = site ? ` di Site ${site.name} (${site.code})` : '';
          const deadlineText = t.deadline ? `\n   ⏳ Deadline: ${moment(t.deadline).format('DD-MM-YYYY')}` : '';
          
          currentMessage += `${i + 1}. *${t.name}*${siteText}${deadlineText}\n`;
          
          if ((i + 1) % CHUNK_SIZE === 0 || i === tasks.length - 1) {
            if (i === tasks.length - 1) {
               currentMessage += `\nMohon segera diselesaikan tepat waktu. Terima kasih!`;
            } else {
               currentMessage += `\n*(Berlanjut ke pesan berikutnya...)*`;
            }
            
            await this.whatsappService.sendMessage(user.phone, currentMessage);
            
            if (i !== tasks.length - 1) {
               currentMessage = `*(Lanjutan ${i + 2}-${Math.min(i + 1 + CHUNK_SIZE, tasks.length)} dari ${totalTasks} tugas)*\n\n`;
            }
          }
        }
      }
      
      this.logger.log(`Successfully sent daily notifications to ${Object.keys(tasksByUser).length} users.`);
    } catch (error) {
      this.logger.error('Failed to send daily workload notifications', error);
    }
  }
}
