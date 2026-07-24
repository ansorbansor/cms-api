import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getManager } from 'typeorm';
import { Absence } from 'src/entities/absence.entity';
import { User } from 'src/entities/user.entity';
import { WhatsappService } from 'src/modules/whatsapp/whatsapp.service';
import { getFlag } from 'src/utils/feature-flags.util';
import moment from 'moment';

@Injectable()
export class AbsenceCronService {
  private readonly logger = new Logger(AbsenceCronService.name);

  constructor(
    @InjectRepository(Absence)
    private readonly absenceRepo: Repository<Absence>,
    private readonly whatsappService: WhatsappService
  ) { }

  @Cron('0 10 * * *', { timeZone: 'Asia/Jakarta' })
  async handleDailyAbsenceReminder() {
    this.logger.log('Triggering daily absence reminder at 10:00 AM');

    const groupName = getFlag('whatsapp_absence_group_name', '');
    if (!groupName) {
      this.logger.warn('No WhatsApp Absence Group Name configured. Skipping reminder.');
      return;
    }

    try {
      // 1. Fetch Target Users
      const users = await getManager().getRepository(User).createQueryBuilder('user')
        .leftJoinAndSelect('user.employeePosition', 'position')
        .where('LOWER(user.level_iresource) = :internal', { internal: 'internal' })
        .andWhere('(LOWER(user.status_description) = :onboard1 OR LOWER(user.status_description) = :onboard2)', { onboard1: 'on board', onboard2: 'on bord' })
        .getMany();

      if (!users || users.length === 0) return;

      const usersNotAbsence = [];
      const todayDate = moment().format('YYYY-MM-DD');

      for (const user of users) {
        const latestAbsence = await this.absenceRepo.findOne({
          where: { user_id: user.id },
          order: { clock_in: 'DESC' }
        });

        if (!latestAbsence) {
          usersNotAbsence.push(user);
        } else if (latestAbsence.clock_out !== null) {
          const clockInDate = moment(latestAbsence.clock_in).format('YYYY-MM-DD');
          if (clockInDate !== todayDate) {
            usersNotAbsence.push(user);
          }
        }
      }

      if (usersNotAbsence.length === 0) {
        this.logger.log('All users have clocked in. No reminder sent.');
        return;
      }

      const CHUNK_SIZE = 15;
      for (let i = 0; i < usersNotAbsence.length; i += CHUNK_SIZE) {
        const chunk = usersNotAbsence.slice(i, i + CHUNK_SIZE);
        
        let message = '';
        if (i === 0) {
          message += `⚠️ *DAILY ATTENDANCE ALERT* ⚠️\n\nHi RPM & Supervisors, \nPlease remind your team members to clock in immediately. The following staff have not recorded their attendance for today (Part ${i / CHUNK_SIZE + 1}):\n\n`;
        } else {
          message += `⚠️ *DAILY ATTENDANCE ALERT* (Part ${i / CHUNK_SIZE + 1}) ⚠️\n\n`;
        }

        for (const u of chunk) {
          const region = u.gm_region ? u.gm_region : 'Unknown Region';
          message += `👤 *${u.name}* - ${region}\n`;
        }

        if (i + CHUNK_SIZE >= usersNotAbsence.length) {
          message += `\n📊 *Monitor Team Progress:*\nhttps://smarteye.ptbiosron.com/kpi-karyawan/daily-progress\n\n📱 *Download SIMPRO App:*\nhttps://play.google.com/store/apps/details?id=biosron.simpro.apps\n\n📞 *Need Assistance?*\nContact Admin: https://wa.me/6281221691180`;
        }

        if (groupName.endsWith('@g.us')) {
          await this.whatsappService.sendToGroupId(groupName, message);
        } else {
          await this.whatsappService.sendToGroupByName(groupName, message);
        }
        // optional delay to prevent rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (e) {
      this.logger.error('Failed to send daily absence reminder', e);
    }
  }
}
