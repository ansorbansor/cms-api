import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkloadTask } from 'src/entities/workload-task.entity';
import { WorkloadTicket } from 'src/entities/workload-ticket.entity';
import { getFlag } from 'src/utils/feature-flags.util';
import { WhatsappService } from 'src/modules/whatsapp/whatsapp.service';
import moment from 'moment';

@Injectable()
export class WorkloadTicketsCronService {
  private readonly logger = new Logger(WorkloadTicketsCronService.name);

  constructor(
    @InjectRepository(WorkloadTask)
    private readonly taskRepo: Repository<WorkloadTask>,
    @InjectRepository(WorkloadTicket)
    private readonly ticketRepo: Repository<WorkloadTicket>,
    private readonly whatsappService: WhatsappService
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const isEnabled = getFlag('enable_daily_reminder', true);
    if (!isEnabled) return;

    const scheduledTime = getFlag('daily_reminder_time', '08:00');
    const currentTime = moment().format('HH:mm');

    if (currentTime !== scheduledTime) {
      return;
    }

    await this.handleDailyNotifications();
    await this.handleCreatorNotifications();
  }

  async handleDailyNotifications() {
    this.logger.log(`Triggering daily notifications for Workload Tasks`);

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
              currentMessage += `\nMohon segera diselesaikan tepat waktu. *Jika Pending bukan di kamu masuk ke menu Mytask dan add predecessor task agar bola tidak di kamu dan KPI mu terjaga*. Terima kasih!`;
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

  async handleCreatorNotifications() {
    this.logger.log(`Triggering daily notifications for Workload Ticket Creators`);

    try {
      // Find all tickets that are not confirmed finished, along with milestones, tasks, and creator
      const tickets = await this.ticketRepo.find({
        where: [{ status: 'Pending' }, { status: 'In Progress' }, { status: 'Completed' }],
        relations: ['created_by_user', 'milestones', 'milestones.tasks']
      });

      for (const ticket of tickets) {
        const creator = ticket.created_by_user;
        if (!creator || !creator.phone) continue;

        const ticketName = ticket.ticket_id || 'Unknown';

        // 0. If the whole ticket is completed (all milestones done)
        if (ticket.status === 'Completed') {
          const allMilestonesConfirmed = ticket.milestones && ticket.milestones.length > 0 && 
            ticket.milestones.every(m => m.status === 'Confirmed Finished');
          
          if (allMilestonesConfirmed) {
            const msg = `Hai ${creator.name}, Workload Ticket kamu (${ticketName}) sudah tidak memiliki pending Milestone pastikan semua milestone sudah selesai dan dapat ditagihkn, click Confirm Finished pada detail workload ticket di Smarteye .`;
            await this.whatsappService.sendMessage(creator.phone, msg);
            continue; // skip checking individual milestones since all are confirmed
          }
          // If not all milestones are confirmed finished, we let the loop continue below
          // so that it can remind the creator to confirm the remaining 'Completed' milestones!
        }

        // 1. If workload ticket has no milestone
        if (!ticket.milestones || ticket.milestones.length === 0) {
          const msg = `Hai ${creator.name} workload ticket kamu ${ticketName} belum memiliki Milestone apa-apa, segera buatkan milestone dan task nya agar PIC under mu memiliki KPI yang baik`;
          await this.whatsappService.sendMessage(creator.phone, msg);
          continue;
        }

        // Check milestones
        for (const milestone of ticket.milestones) {
          const milestoneName = milestone.name || 'Unknown';

          // 2. If milestone is completed
          if (milestone.status === 'Completed') {
            const msg = `Hai ${creator.name} Milestone *${milestoneName}* di workload ticket kamu *${ticketName}* sudah selesai dikerjakan. Aku akan teruskan ini ke team ESAR. pastikan beneran udah bisa ditagih ya, kalau tidak harap tambahkan task baru di milestone nya, Jika memang sudah selesai masuk ke Workload tikect detail dan tekan *CONFIRM FINISH* pada milestone *${milestoneName}*`;
            await this.whatsappService.sendMessage(creator.phone, msg);
            continue;
          }

          // 3. If milestone has no task (and it's not completed)
          if (!milestone.tasks || milestone.tasks.length === 0) {
            const msg = `Hai ${creator.name} workload ticket kamu (${ticketName} - ${milestoneName}) belum memiliki task apa-apa, segera buatkan milestone dan task nya agar PIC under mu memiliki KPI yang baik`;
            await this.whatsappService.sendMessage(creator.phone, msg);
            continue;
          }
        }
      }

      this.logger.log(`Successfully processed creator notifications.`);
    } catch (error) {
      this.logger.error('Failed to send creator workload notifications', error);
    }
  }
}
