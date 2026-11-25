import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getManager, LessThanOrEqual } from 'typeorm';
import { Absence, AbsenceStatus, AbsenceType } from 'src/entities/absence.entity';
import { User } from 'src/entities/user.entity';
import { WhatsappService } from 'src/modules/whatsapp/whatsapp.service';
import { getFlag } from 'src/utils/feature-flags.util';
import moment from 'moment';
import axios from 'axios';

@Injectable()
export class AbsenceCronService {
  private readonly logger = new Logger(AbsenceCronService.name);

  constructor(
    @InjectRepository(Absence)
    private readonly absenceRepo: Repository<Absence>,
    private readonly whatsappService: WhatsappService,
  ) {}

  private async getHolidays(year: number): Promise<string[]> {
    try {
      const response = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/ID`,
      );
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((h) => h.date);
      }
    } catch (e) {
      this.logger.error(`Error fetching holidays for year ${year}: ${e.message}`);
    }
    return [];
  }

  /**
   * Cron 1: Evaluasi task absensi yang kedaluwarsa (> 7 hari kalender tanpa bukti valid)
   * Berjalan setiap hari pukul 00:05 WIB
   */
  @Cron('5 0 * * *', { timeZone: 'Asia/Jakarta' })
  async handleDailyAbsenceTaskExpiry() {
    this.logger.log('[Cron] Checking expired absence tasks (deadline_at <= NOW)...');
    try {
      const now = new Date();
      const expiredTasks = await this.absenceRepo
        .createQueryBuilder('absence')
        .leftJoinAndSelect('absence.user', 'user')
        .where('absence.status IN (:...statuses)', {
          statuses: [AbsenceStatus.PENDING_EVIDENCE, AbsenceStatus.REJECTED],
        })
        .andWhere('absence.deadline_at IS NOT NULL AND absence.deadline_at <= :now', {
          now,
        })
        .getMany();

      if (!expiredTasks || expiredTasks.length === 0) {
        this.logger.log('[Cron] No expired absence tasks found.');
        return;
      }

      this.logger.log(`[Cron] Found ${expiredTasks.length} expired absence tasks. Converting to AUTO_POTONG_GAJI...`);

      for (const task of expiredTasks) {
        const originalType = task.absence_type;
        task.absence_type = AbsenceType.IZIN_POTONG_GAJI;
        task.status = AbsenceStatus.AUTO_POTONG_GAJI;
        const autoNote = `Otomatis diubah menjadi Izin Potong Gaji karena batas waktu konfirmasi 7 hari kalender telah berakhir (Tipe semula: ${originalType}).`;
        task.notes = task.notes ? `${task.notes} | ${autoNote}` : autoNote;

        await this.absenceRepo.save(task);

        if (task.user && task.user.phone) {
          const dateStr = task.absence_date || (task.clock_in ? moment(task.clock_in).format('DD-MM-YYYY') : '-');
          const msg = `⚠️ *Pemberitahuan Sistem Absensi SIMPRO* ⚠️\n\nHalo ${task.user.name},\nBatas waktu konfirmasi / unggah bukti absensi untuk tanggal *${dateStr}* telah berakhir. Sistem telah secara otomatis menetapkan status hari tersebut menjadi *Izin Dengan Pemotongan Gaji*.\n\nJika ada pertanyaan, silakan hubungi tim HR.`;
          try {
            await this.whatsappService.sendMessage(task.user.phone, msg);
          } catch (waErr) {
            this.logger.error(`Failed to send WhatsApp alert to ${task.user.phone}: ${waErr.message}`);
          }
        }
      }
    } catch (err) {
      this.logger.error('[Cron] Error evaluating expired absence tasks', err);
    }
  }

  /**
   * Cron 2: Deteksi hari kerja kosong (Alpha) yang melewati 7 hari kalender tanpa klarifikasi
   * Berjalan setiap hari pukul 00:15 WIB
   */
  @Cron('15 0 * * *', { timeZone: 'Asia/Jakarta' })
  async handleUnrecordedWorkdays() {
    this.logger.log('[Cron] Checking unrecorded workdays past 7 calendar days...');
    try {
      const targetMoment = moment().subtract(7, 'days');
      const dayOfWeek = targetMoment.day(); // 0=Sun, 6=Sat
      const targetDateStr = targetMoment.format('YYYY-MM-DD');

      // Evaluasi hanya hari kerja (Senin - Jumat)
      if (dayOfWeek < 1 || dayOfWeek > 5) {
        this.logger.log(`[Cron] Date ${targetDateStr} was weekend. Skipping.`);
        return;
      }

      // Evaluasi apakah hari libur nasional
      const holidays = await this.getHolidays(targetMoment.year());
      if (holidays.includes(targetDateStr)) {
        this.logger.log(`[Cron] Date ${targetDateStr} was public holiday. Skipping.`);
        return;
      }

      // Ambil seluruh user internal onboard
      const users = await getManager()
        .getRepository(User)
        .createQueryBuilder('user')
        .where('LOWER(user.level_iresource) = :internal', { internal: 'internal' })
        .andWhere(
          '(LOWER(user.status_description) = :onboard1 OR LOWER(user.status_description) = :onboard2)',
          { onboard1: 'on board', onboard2: 'on bord' },
        )
        .andWhere('user.deleted_at IS NULL')
        .getMany();

      if (!users || users.length === 0) return;

      const startOfDay = targetMoment.clone().startOf('day').toDate();
      const endOfDay = targetMoment.clone().endOf('day').toDate();

      for (const u of users) {
        const existing = await this.absenceRepo
          .createQueryBuilder('absence')
          .where('absence.user_id = :userId', { userId: u.id })
          .andWhere(
            '(absence.absence_date = :targetDateStr OR (absence.clock_in >= :startOfDay AND absence.clock_in <= :endOfDay))',
            { targetDateStr, startOfDay, endOfDay },
          )
          .getOne();

        if (!existing) {
          this.logger.log(`[Cron] User #${u.id} (${u.name}) has no absence on ${targetDateStr}. Generating AUTO_POTONG_GAJI.`);

          const autoAbsence = this.absenceRepo.create({
            user_id: u.id,
            absence_type: AbsenceType.IZIN_POTONG_GAJI,
            status: AbsenceStatus.AUTO_POTONG_GAJI,
            absence_date: targetDateStr,
            source: 'system',
            notes: `Otomatis dibuat oleh sistem (Izin Potong Gaji) karena tidak ada presensi dan masa tenggang 7 hari kalender telah berakhir tanpa klarifikasi.`,
          });

          await this.absenceRepo.save(autoAbsence);

          if (u.phone) {
            const msg = `⚠️ *Pemberitahuan Sistem Absensi SIMPRO* ⚠️\n\nHalo ${u.name},\nAnda tercatat tidak melakukan presensi pada hari kerja tanggal *${targetMoment.format('DD-MM-YYYY')}*, dan masa tenggang klarifikasi 7 hari kalender telah berakhir tanpa ada pengajuan cuti/sakit.\nSistem secara otomatis menetapkan status hari tersebut menjadi *Izin Dengan Pemotongan Gaji*.`;
            try {
              await this.whatsappService.sendMessage(u.phone, msg);
            } catch (waErr) {
              this.logger.error(`Failed to send WA message: ${waErr.message}`);
            }
          }
        }
      }
    } catch (err) {
      this.logger.error('[Cron] Error processing unrecorded workdays', err);
    }
  }

  /**
   * Cron 3: Reminder peringatan deadline bukti absensi (<= 2 hari tersisa)
   * Berjalan setiap hari kerja pukul 09:00 WIB
   */
  @Cron('0 9 * * 1-5', { timeZone: 'Asia/Jakarta' })
  async handleDeadlineWarningReminder() {
    this.logger.log('[Cron] Checking deadline warnings for pending absence evidence...');
    try {
      const now = moment();
      const twoDaysLater = moment().add(2, 'days').endOf('day').toDate();

      const urgentTasks = await this.absenceRepo
        .createQueryBuilder('absence')
        .leftJoinAndSelect('absence.user', 'user')
        .where('absence.status IN (:...statuses)', {
          statuses: [AbsenceStatus.PENDING_EVIDENCE, AbsenceStatus.REJECTED],
        })
        .andWhere('absence.deadline_at IS NOT NULL')
        .andWhere('absence.deadline_at >= :now AND absence.deadline_at <= :twoDaysLater', {
          now: now.toDate(),
          twoDaysLater,
        })
        .getMany();

      for (const t of urgentTasks) {
        if (t.user && t.user.phone) {
          const daysLeft = Math.max(1, Math.ceil(moment(t.deadline_at).diff(now, 'hours') / 24));
          const dateStr = t.absence_date || (t.clock_in ? moment(t.clock_in).format('DD-MM-YYYY') : '-');
          const isReject = t.status === AbsenceStatus.REJECTED;

          const msg = `⏳ *Peringatan Tenggat Waktu Absensi SIMPRO* ⏳\n\nHalo ${t.user.name},\nPengajuan ${t.absence_type} Anda untuk tanggal *${dateStr}* ${isReject ? 'yang sempat ditolak HR ' : ''}memiliki sisa batas waktu pengunggahan bukti *${daysLeft} hari lagi* (Batas: ${moment(t.deadline_at).format('DD-MM-YYYY HH:mm')}).\n\nSegera buka aplikasi SIMPRO dan unggah bukti Anda agar tidak otomatis dihitung sebagai *Izin Potong Gaji*.`;

          try {
            await this.whatsappService.sendMessage(t.user.phone, msg);
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (waErr) {
            this.logger.error(`Failed to send WA reminder: ${waErr.message}`);
          }
        }
      }
    } catch (err) {
      this.logger.error('[Cron] Error sending deadline warnings', err);
    }
  }

  /**
   * Cron 4: Daily Clock-in reminder jam 10:00 (Original)
   */
  @Cron('0 10 * * 1-5', { timeZone: 'Asia/Jakarta' })
  async handleDailyAbsenceReminder() {
    this.logger.log('Triggering daily absence reminder at 10:00 AM');

    const groupName = getFlag('whatsapp_absence_group_name', '');
    if (!groupName) {
      this.logger.warn('No WhatsApp Absence Group Name configured. Skipping reminder.');
      return;
    }

    try {
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
        } else {
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

          if (u.phone) {
            const personalMessage = `⚠️ *ATTENDANCE REMINDER* ⚠️\n\nHi ${u.name},\n\nYou have not yet recorded your attendance for today. Please open the SIMPRO app and clock in immediately.\n\n📊 *Monitor Team Progress:*\nhttps://smarteye.ptbiosron.com/kpi-karyawan/daily-progress\n\n📱 *Download SIMPRO App:*\nhttps://play.google.com/store/apps/details?id=biosron.simpro.apps\n\n📞 *Need Assistance?*\nContact Admin: https://wa.me/6281221691180`;
            await this.whatsappService.sendMessage(u.phone, personalMessage);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (i + CHUNK_SIZE >= usersNotAbsence.length) {
          message += `\n📊 *Monitor Team Progress:*\nhttps://smarteye.ptbiosron.com/kpi-karyawan/daily-progress\n\n📱 *Download SIMPRO App:*\nhttps://play.google.com/store/apps/details?id=biosron.simpro.apps\n\n📞 *Need Assistance?*\nContact Admin: https://wa.me/6281221691180`;
        }

        if (groupName.endsWith('@g.us')) {
          await this.whatsappService.sendToGroupId(groupName, message);
        } else {
          await this.whatsappService.sendToGroupByName(groupName, message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (e) {
      this.logger.error('Failed to send daily absence reminder', e);
    }
  }
}
