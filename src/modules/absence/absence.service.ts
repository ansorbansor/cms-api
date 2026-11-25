import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { getFlag } from 'src/utils/feature-flags.util';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository, getManager, Brackets } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Absence, AbsenceStatus, AbsenceType } from 'src/entities/absence.entity';
import { LeaveQuota } from 'src/entities/leave-quota.entity';
import { CreateAbsenceDTO } from './dto/create-absence.dto';
import {
  AbsenceResource,
  AbsenceResourceDetail,
  HasAbsenceToday,
} from './resources/absence.resources';
import { ClockOutAbsenceDTO } from './dto/clock-out-absence.dto';
import { RequestLeaveDTO } from './dto/request-leave.dto';
import { ClarifyUnrecordedDTO } from './dto/clarify-unrecorded.dto';
import { ReviewAbsenceDTO } from './dto/review-absence.dto';
import { UpdateLeaveQuotaDTO } from './dto/update-leave-quota.dto';
import moment from 'moment';
import { FilesService } from '../files/files.service';
import { FilePath } from 'src/utils/enums';

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Absence)
    private absenceRepository: Repository<Absence>,
    @InjectRepository(LeaveQuota)
    private leaveQuotaRepository: Repository<LeaveQuota>,
    private activityLogService: ActivityLogService,
    private fileService: FilesService,
  ) {}

  private async getKecamatan(lat: any, lng: any): Promise<string> {
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    if (isNaN(pLat) || isNaN(pLng) || (pLat === 0 && pLng === 0)) return null;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const res = await axios.get(
        `https://photon.komoot.io/reverse?lon=${pLng}&lat=${pLat}`,
      );
      if (res.data && res.data.features && res.data.features.length > 0) {
        const props = res.data.features[0].properties;
        const locality =
          props.district || props.county || props.locality || props.name || '';
        const city = props.city || props.state || '';

        if (locality && city && locality !== city) {
          return `${locality} - ${city}`;
        }
        return locality || city || null;
      }
    } catch (e) {
      console.error(
        `[Geocoding] Error fetching kecamatan for ${pLat}, ${pLng}:`,
        e.message,
      );
    }
    return null;
  }

  private getDistanceFromLatLonInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  async getHolidays(year: number): Promise<string[]> {
    try {
      const response = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/ID`,
      );
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((h) => h.date);
      }
    } catch (e) {
      console.error(`Error fetching holidays for year ${year}:`, e.message);
    }
    return [];
  }

  // ===================== LEAVE QUOTA MANAGEMENT =====================

  async getOrCreateLeaveQuota(
    userId: number,
    year: number = moment().year(),
  ): Promise<LeaveQuota> {
    let quota = await this.leaveQuotaRepository.findOne({
      where: { user_id: userId, year: year },
    });

    if (!quota) {
      quota = this.leaveQuotaRepository.create({
        user_id: userId,
        year: year,
        total_quota: 12,
        used_quota: 0,
        remaining_quota: 12,
      });
      quota = await this.leaveQuotaRepository.save(quota);
    }

    return quota;
  }

  async getLeaveQuota(userId: number, year?: number) {
    const targetYear = year ? Number(year) : moment().year();
    const quota = await this.getOrCreateLeaveQuota(userId, targetYear);
    return {
      user_id: quota.user_id,
      year: quota.year,
      total_quota: quota.total_quota,
      used_quota: quota.used_quota,
      remaining_quota: quota.remaining_quota,
      adjustment_notes: quota.adjustment_notes,
    };
  }

  async getLeaveQuotas(year?: number, search?: string) {
    const targetYear = year ? Number(year) : moment().year();
    const qb = getManager()
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .leftJoinAndMapOne(
        'user.leaveQuota',
        LeaveQuota,
        'quota',
        'quota.user_id = user.id AND quota.year = :year',
        { year: targetYear },
      )
      .where(
        '(LOWER(user.status_description) = :onboard1 OR LOWER(user.status_description) = :onboard2)',
        { onboard1: 'on board', onboard2: 'on bord' },
      )
      .andWhere('LOWER(user.level_iresource) = :internal', {
        internal: 'internal',
      });

    if (search) {
      qb.andWhere('(user.name ILIKE :search OR user.nik ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('user.name', 'ASC');
    const users = await qb.getMany();

    return users.map((u) => {
      const q = (u as any).leaveQuota;
      return {
        user_id: u.id,
        nik: u.nik,
        name: u.name,
        region: u.region,
        role: u.employeePosition?.name || 'Staff',
        year: targetYear,
        total_quota: q ? q.total_quota : 12,
        used_quota: q ? q.used_quota : 0,
        remaining_quota: q ? q.remaining_quota : 12,
        adjustment_notes: q ? q.adjustment_notes : null,
      };
    });
  }

  async updateLeaveQuota(
    userId: number,
    year: number,
    dto: UpdateLeaveQuotaDTO,
    adminUser: User,
    ip: string,
  ) {
    const targetYear = year ? Number(year) : moment().year();
    let quota = await this.getOrCreateLeaveQuota(userId, targetYear);

    const oldTotal = quota.total_quota;
    quota.total_quota = dto.total_quota;
    quota.remaining_quota = Math.max(0, quota.total_quota - quota.used_quota);
    if (dto.adjustment_notes !== undefined) {
      quota.adjustment_notes = dto.adjustment_notes;
    }

    await this.leaveQuotaRepository.save(quota);

    await this.activityLogService.create({
      user_id: adminUser.id,
      description: `Ubah kuota cuti user #${userId} tahun ${targetYear} dari ${oldTotal} menjadi ${dto.total_quota}`,
      ip: ip,
    });

    return quota;
  }

  // ===================== LEAVE & CLARIFICATION REQUESTS =====================

  async requestLeave(
    dto: RequestLeaveDTO,
    userId: number,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const targetDate = dto.absence_date
      ? moment(dto.absence_date).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    // Check existing absence for targetDate
    const existing = await this.absenceRepository
      .createQueryBuilder('absence')
      .where('absence.user_id = :userId', { userId })
      .andWhere(
        '(absence.absence_date = :targetDate OR (absence.clock_in >= :startOfDay AND absence.clock_in <= :endOfDay))',
        {
          targetDate,
          startOfDay: moment(targetDate).startOf('day').toDate(),
          endOfDay: moment(targetDate).endOf('day').toDate(),
        },
      )
      .getOne();

    if (existing) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Absensi atau pengajuan untuk tanggal tersebut sudah pernah tercatat!',
      );
    }

    // Check annual leave quota if CUTI_TAHUNAN
    if (dto.absence_type === AbsenceType.CUTI_TAHUNAN) {
      const quota = await this.getOrCreateLeaveQuota(
        userId,
        moment(targetDate).year(),
      );
      if (quota.remaining_quota <= 0) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Sisa kuota cuti tahunan Anda telah habis (0 hari). Silakan pilih opsi lain.',
        );
      }
    }

    // Check uploaded evidence file
    const evidenceFile = files?.find(
      (f) =>
        f.fieldname === 'evidence_file' ||
        f.fieldname === 'file' ||
        f.fieldname === 'attachment',
    );
    let evidenceFileId: number | null = null;

    if (evidenceFile) {
      const uploaded = await this.fileService.uploadFile(
        evidenceFile,
        userId,
        FilePath.ABSENCE_EVIDENCE,
        `Bukti ${dto.absence_type}`,
      );
      evidenceFileId = uploaded.id;
    }

    // Determine status & deadline
    let status = AbsenceStatus.PENDING_EVIDENCE;
    let deadlineAt: Date | null = moment(targetDate)
      .add(7, 'days')
      .endOf('day')
      .toDate();
    let evidenceUploadedAt: Date | null = null;

    if (dto.absence_type === AbsenceType.IZIN_POTONG_GAJI) {
      status = AbsenceStatus.COMPLETED;
      deadlineAt = null;
    } else if (evidenceFileId) {
      status = AbsenceStatus.PENDING_APPROVAL;
      evidenceUploadedAt = new Date();
    }

    const absence = this.absenceRepository.create({
      user_id: userId,
      absence_type: dto.absence_type,
      status: status,
      absence_date: targetDate,
      is_clarification: false,
      special_leave_type: dto.special_leave_type || null,
      notes: dto.notes || null,
      evidence_file_id: evidenceFileId,
      evidence_uploaded_at: evidenceUploadedAt,
      deadline_at: deadlineAt,
      source: 'app',
    });

    const saved = await this.absenceRepository.save(absence);

    await this.activityLogService.create({
      user_id: userId,
      description: `Pengajuan ${dto.absence_type} tanggal ${targetDate}`,
      ip: ip,
    });

    return await this.findOne({ id: saved.id });
  }

  async clarifyUnrecorded(
    dto: ClarifyUnrecordedDTO,
    userId: number,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    // 1. Strict options validation: ONLY CUTI_TAHUNAN, SAKIT, CUTI_KHUSUS allowed
    const allowedTypes = [
      AbsenceType.CUTI_TAHUNAN,
      AbsenceType.SAKIT,
      AbsenceType.CUTI_KHUSUS,
    ];
    if (!allowedTypes.includes(dto.absence_type as AbsenceType)) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Pilihan klarifikasi hari kosong HANYA diperbolehkan: Cuti Tahunan, Sakit, atau Cuti Khusus.',
      );
    }

    // 2. Date validation: must be past workday, and within 7 calendar days
    const targetMoment = moment(dto.absence_date, 'YYYY-MM-DD');
    const today = moment().startOf('day');

    if (!targetMoment.isValid() || !targetMoment.isBefore(today)) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Tanggal klarifikasi harus berupa hari kerja yang sudah terlewat.',
      );
    }

    const daysElapsed = today.diff(targetMoment, 'days');
    if (daysElapsed > 7) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Batas waktu klarifikasi 7 hari kalender untuk tanggal ini telah terlewati.',
      );
    }

    // 3. Absence already exists check
    const existing = await this.absenceRepository
      .createQueryBuilder('absence')
      .where('absence.user_id = :userId', { userId })
      .andWhere(
        '(absence.absence_date = :targetDate OR (absence.clock_in >= :startOfDay AND absence.clock_in <= :endOfDay))',
        {
          targetDate: dto.absence_date,
          startOfDay: targetMoment.clone().startOf('day').toDate(),
          endOfDay: targetMoment.clone().endOf('day').toDate(),
        },
      )
      .getOne();

    if (existing) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Absensi pada tanggal ini sudah tercatat.',
      );
    }

    // 4. Quota check for CUTI_TAHUNAN
    if (dto.absence_type === AbsenceType.CUTI_TAHUNAN) {
      const quota = await this.getOrCreateLeaveQuota(
        userId,
        targetMoment.year(),
      );
      if (quota.remaining_quota <= 0) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Sisa kuota cuti tahunan Anda 0 hari. Anda tidak dapat memilih Cuti Tahunan.',
        );
      }
    }

    // 5. Evidence file handling
    const evidenceFile = files?.find(
      (f) =>
        f.fieldname === 'evidence_file' ||
        f.fieldname === 'file' ||
        f.fieldname === 'attachment',
    );
    let evidenceFileId: number | null = null;

    if (evidenceFile) {
      const uploaded = await this.fileService.uploadFile(
        evidenceFile,
        userId,
        FilePath.ABSENCE_EVIDENCE,
        `Bukti Klarifikasi ${dto.absence_type}`,
      );
      evidenceFileId = uploaded.id;
    }

    let status = AbsenceStatus.PENDING_EVIDENCE;
    let evidenceUploadedAt: Date | null = null;
    if (evidenceFileId) {
      status = AbsenceStatus.PENDING_APPROVAL;
      evidenceUploadedAt = new Date();
    }

    const deadlineAt = targetMoment
      .clone()
      .add(7, 'days')
      .endOf('day')
      .toDate();

    const absence = this.absenceRepository.create({
      user_id: userId,
      absence_type: dto.absence_type,
      status: status,
      absence_date: dto.absence_date,
      is_clarification: true,
      special_leave_type: dto.special_leave_type || null,
      notes: dto.notes || null,
      evidence_file_id: evidenceFileId,
      evidence_uploaded_at: evidenceUploadedAt,
      deadline_at: deadlineAt,
      source: 'app',
    });

    const saved = await this.absenceRepository.save(absence);

    await this.activityLogService.create({
      user_id: userId,
      description: `Klarifikasi Hari Kosong (${dto.absence_date}): ${dto.absence_type}`,
      ip: ip,
    });

    return await this.findOne({ id: saved.id });
  }

  async uploadEvidence(
    absenceId: number,
    userId: number,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const absence = await this.absenceRepository.findOne({
      where: { id: absenceId },
    });

    if (!absence) {
      throw failedResponse(HttpStatus.NOT_FOUND, 'Data absensi tidak ditemukan');
    }

    if (absence.user_id !== userId) {
      throw failedResponse(
        HttpStatus.FORBIDDEN,
        'Anda tidak memiliki akses untuk absensi ini',
      );
    }

    if (
      ![AbsenceStatus.PENDING_EVIDENCE, AbsenceStatus.REJECTED].includes(
        absence.status as AbsenceStatus,
      )
    ) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Absensi ini saat ini tidak membutuhkan pengunggahan bukti',
      );
    }

    if (absence.deadline_at && moment().isAfter(moment(absence.deadline_at))) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Batas waktu unggah bukti (7 hari kalender) telah berakhir',
      );
    }

    const evidenceFile = files?.find(
      (f) =>
        f.fieldname === 'evidence_file' ||
        f.fieldname === 'file' ||
        f.fieldname === 'attachment',
    );

    if (!evidenceFile) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Harap sertakan file dokumen atau foto bukti!',
      );
    }

    const uploaded = await this.fileService.uploadFile(
      evidenceFile,
      userId,
      FilePath.ABSENCE_EVIDENCE,
      `Bukti ${absence.absence_type}`,
    );

    absence.evidence_file_id = uploaded.id;
    absence.evidence_uploaded_at = new Date();
    absence.status = AbsenceStatus.PENDING_APPROVAL;

    await this.absenceRepository.save(absence);

    await this.activityLogService.create({
      user_id: userId,
      description: `Upload bukti absensi #${absence.id}`,
      ip: ip,
    });

    return await this.findOne({ id: absence.id });
  }

  async reviewAbsence(
    absenceId: number,
    dto: ReviewAbsenceDTO,
    adminUser: User,
    ip: string,
  ) {
    const absence = await this.absenceRepository.findOne({
      where: { id: absenceId },
    });

    if (!absence) {
      throw failedResponse(HttpStatus.NOT_FOUND, 'Data absensi tidak ditemukan');
    }

    if (absence.status !== AbsenceStatus.PENDING_APPROVAL) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Hanya absensi berstatus Menunggu Review yang dapat direview oleh HR',
      );
    }

    if (dto.action === 'APPROVE') {
      if (absence.absence_type === AbsenceType.CUTI_TAHUNAN) {
        const year = absence.absence_date
          ? moment(absence.absence_date).year()
          : moment(absence.clock_in).year();
        const quota = await this.getOrCreateLeaveQuota(absence.user_id, year);

        quota.used_quota += 1;
        quota.remaining_quota = Math.max(0, quota.total_quota - quota.used_quota);
        await this.leaveQuotaRepository.save(quota);
      }

      absence.status = AbsenceStatus.APPROVED;
      absence.reviewed_by = adminUser.id;
      absence.reviewed_at = new Date();
    } else if (dto.action === 'REJECT') {
      if (!dto.rejection_reason) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Alasan penolakan wajib diisi!',
        );
      }

      absence.status = AbsenceStatus.REJECTED;
      absence.rejection_reason = dto.rejection_reason;
      absence.rejected_at = new Date();
      absence.reviewed_by = adminUser.id;
      absence.reviewed_at = new Date();

      // Reset deadline to +7 calendar days from reject date
      absence.deadline_at = moment()
        .add(7, 'days')
        .endOf('day')
        .toDate();
    }

    await this.absenceRepository.save(absence);

    await this.activityLogService.create({
      user_id: adminUser.id,
      description: `Review absensi #${absence.id}: ${dto.action}`,
      ip: ip,
    });

    return await this.findOne({ id: absence.id });
  }

  async getUnrecordedDays(userId: number) {
    const holidays = await this.getHolidays(moment().year());
    const unrecordedDays = [];

    const existingAbsences = await this.absenceRepository
      .createQueryBuilder('absence')
      .where('absence.user_id = :userId', { userId })
      .andWhere(
        '(absence.absence_date >= :sevenDaysAgo OR absence.clock_in >= :sevenDaysAgoStart)',
        {
          sevenDaysAgo: moment().subtract(7, 'days').format('YYYY-MM-DD'),
          sevenDaysAgoStart: moment()
            .subtract(7, 'days')
            .startOf('day')
            .toDate(),
        },
      )
      .getMany();

    const existingDates = new Set<string>();
    for (const a of existingAbsences) {
      if (a.absence_date) {
        existingDates.add(moment(a.absence_date).format('YYYY-MM-DD'));
      }
      if (a.clock_in) {
        existingDates.add(moment(a.clock_in).format('YYYY-MM-DD'));
      }
    }

    for (let i = 1; i <= 7; i++) {
      const d = moment().subtract(i, 'days');
      const dayOfWeek = d.day(); // 0=Sun, 6=Sat
      const dateStr = d.format('YYYY-MM-DD');

      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays.includes(dateStr)) {
        if (!existingDates.has(dateStr)) {
          const daysElapsed = i;
          const daysRemaining = Math.max(0, 7 - daysElapsed);
          const deadlineDate = d
            .clone()
            .add(7, 'days')
            .format('YYYY-MM-DD 23:59:59');
          unrecordedDays.push({
            date: dateStr,
            formatted_date: d.format('dddd, DD MMMM YYYY'),
            day_name: d.format('dddd'),
            days_elapsed: daysElapsed,
            days_remaining: daysRemaining,
            deadline_date: deadlineDate,
          });
        }
      }
    }

    return unrecordedDays;
  }

  async getMyTasks(userId: number) {
    const tasks = await this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.evidence_file', 'evidence_file')
      .where('absence.user_id = :userId', { userId })
      .andWhere('absence.status IN (:...statuses)', {
        statuses: [AbsenceStatus.PENDING_EVIDENCE, AbsenceStatus.REJECTED],
      })
      .orderBy('absence.deadline_at', 'ASC')
      .getMany();

    return tasks.map((t) => {
      const now = moment();
      const deadline = moment(t.deadline_at);
      const hoursRemaining = Math.max(0, deadline.diff(now, 'hours'));
      const daysRemaining = Math.max(0, Math.ceil(hoursRemaining / 24));
      return {
        id: t.id,
        absence_type: t.absence_type,
        status: t.status,
        absence_date:
          t.absence_date ||
          (t.clock_in ? moment(t.clock_in).format('YYYY-MM-DD') : '-'),
        special_leave_type: t.special_leave_type,
        notes: t.notes,
        rejection_reason: t.rejection_reason,
        rejected_at: t.rejected_at
          ? moment(t.rejected_at).format('YYYY-MM-DD HH:mm:ss')
          : null,
        deadline_at: t.deadline_at
          ? moment(t.deadline_at).format('YYYY-MM-DD HH:mm:ss')
          : null,
        days_remaining: daysRemaining,
        hours_remaining: hoursRemaining,
        is_expired: now.isAfter(deadline),
      };
    });
  }

  // ===================== STANDARD CLOCK IN / OUT =====================

  async create(
    createAbsenceDTO: CreateAbsenceDTO,
    user_id: number,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const clockInPhoto = files?.find((e) => e.fieldname === 'clock_in_photo');

    if (!clockInPhoto) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Harap kirimkan clock in photo!',
      );
    }

    const uploadedPhoto = await this.fileService.uploadFile(
      clockInPhoto,
      user_id,
      FilePath.CLOCK_IN,
      'Clock In',
    );

    createAbsenceDTO.clock_in_photo = uploadedPhoto.id;
    createAbsenceDTO.user_id = user_id;
    createAbsenceDTO.clock_in = moment().toDate();

    createAbsenceDTO.clock_in_kecamatan = await this.getKecamatan(
      createAbsenceDTO.clock_in_latitude,
      createAbsenceDTO.clock_in_longitude,
    );

    const todayDate = moment().format('YYYY-MM-DD');

    const absence = this.absenceRepository.create({
      ...createAbsenceDTO,
      absence_type: AbsenceType.CLOCK_IN_OUT,
      status: AbsenceStatus.COMPLETED,
      absence_date: todayDate,
    });

    const saved = await this.absenceRepository.save(absence);

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Absence (Clock In)`,
      ip: ip,
    });

    return saved;
  }

  async clockOut(
    id: number,
    clockOutAbsence: ClockOutAbsenceDTO,
    user: User,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Absence tidak ditemukan',
      );
    }

    const clockOutPhoto = files?.find((e) => e.fieldname === 'clock_out_photo');

    if (!clockOutPhoto) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Harap kirimkan clock out photo!',
      );
    }

    const uploadedPhoto = await this.fileService.uploadFile(
      clockOutPhoto,
      user.id,
      FilePath.CLOCK_OUT,
      'Clock Out',
    );

    clockOutAbsence.clock_out_photo = uploadedPhoto.id;
    clockOutAbsence.clock_out = moment().toDate();
    clockOutAbsence.clock_out_kecamatan = await this.getKecamatan(
      clockOutAbsence.clock_out_latitude,
      clockOutAbsence.clock_out_longitude,
    );

    await this.absenceRepository.update(id, {
      ...clockOutAbsence,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Clock Out Absence`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  // ===================== FIND MANY WITH PAGINATION =====================

  async findManyWithPagination(
    paginationOptions: Omit<IPaginationOptions, 'status'> & {
      absence_type?: string;
      status?: string;
      needs_review?: boolean;
    },
  ) {
    const data = this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.user', 'user')
      .leftJoinAndSelect('absence.evidence_file', 'evidence_file')
      .leftJoinAndSelect('absence.reviewer', 'reviewer');

    if (paginationOptions.search) {
      data.andWhere(
        '(user.name ILIKE :search OR user.nik ILIKE :search)',
        {
          search: `%${paginationOptions.search}%`,
        },
      );
    }

    if (paginationOptions.user_id) {
      data.andWhere('user.id = :userId', {
        userId: paginationOptions.user_id,
      });
    }

    if (paginationOptions.absence_type) {
      data.andWhere('absence.absence_type = :absenceType', {
        absenceType: paginationOptions.absence_type,
      });
    }

    if (paginationOptions.status) {
      data.andWhere('absence.status = :status', {
        status: paginationOptions.status,
      });
    }

    if (paginationOptions.needs_review) {
      data.andWhere('absence.status = :needsReviewStatus', {
        needsReviewStatus: AbsenceStatus.PENDING_APPROVAL,
      });
    }

    if (paginationOptions.start_date && paginationOptions.end_date) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(
            'absence.absence_date >= :startDate AND absence.absence_date <= :endDate',
            {
              startDate: paginationOptions.start_date,
              endDate: paginationOptions.end_date,
            },
          ).orWhere(
            'absence.clock_in >= :startDateTime AND absence.clock_in <= :endDateTime',
            {
              startDateTime: `${paginationOptions.start_date} 00:00:00`,
              endDateTime: `${paginationOptions.end_date} 23:59:59`,
            },
          );
        }),
      );
    }

    data.orderBy('absence.id', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total || 10;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      AbsenceResource,
      paginationOptions as any,
    );
  }

  async findOne(fields: EntityCondition<Absence>) {
    const data = await this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.user', 'user')
      .leftJoinAndSelect('absence.clock_in_photo_file', 'clock_in_photo_file')
      .leftJoinAndSelect('absence.clock_out_photo_file', 'clock_out_photo_file')
      .leftJoinAndSelect('absence.evidence_file', 'evidence_file')
      .leftJoinAndSelect('absence.reviewer', 'reviewer')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Absence tidak ditemukan',
      );
    }

    return AbsenceResourceDetail(data);
  }

  async hasAbsenceToday(userId: number) {
    const todayDate = moment().format('YYYY-MM-DD');

    // 1. Check if user already submitted leave/cuti/sakit for today
    const leaveToday = await this.absenceRepository
      .createQueryBuilder('absence')
      .where('absence.user_id = :userId', { userId })
      .andWhere('absence.absence_date = :todayDate', { todayDate })
      .orderBy('absence.id', 'DESC')
      .getOne();

    // 2. Fetch leave quota & task reminders
    const leaveQuota = await this.getLeaveQuota(userId, moment().year());
    const pendingTasks = await this.getMyTasks(userId);
    const unrecordedDays = await this.getUnrecordedDays(userId);

    const currTime = moment().toDate().getHours();
    const afterOffice = currTime >= 16;
    const lateAbsence = currTime >= 9;

    if (leaveToday && leaveToday.absence_type !== AbsenceType.CLOCK_IN_OUT) {
      return HasAbsenceToday(
        true,
        leaveToday,
        false,
        false,
        afterOffice,
        lateAbsence,
        leaveToday.id,
        leaveQuota,
        pendingTasks.length,
        unrecordedDays.length,
      );
    }

    // 3. Check regular clock in/out
    const data = await this.absenceRepository
      .createQueryBuilder('absence')
      .where('absence.user_id = :userId', { userId })
      .orderBy('absence.clock_in', 'DESC')
      .getOne();

    if (!data) {
      return HasAbsenceToday(
        false,
        data,
        true,
        false,
        afterOffice,
        lateAbsence,
        null,
        leaveQuota,
        pendingTasks.length,
        unrecordedDays.length,
      );
    }

    if (!data.clock_out) {
      return HasAbsenceToday(
        true,
        data,
        false,
        true,
        afterOffice,
        lateAbsence,
        data.id,
        leaveQuota,
        pendingTasks.length,
        unrecordedDays.length,
      );
    }

    const clockInDate = moment(data.clock_in).format('YYYY-MM-DD');

    if (clockInDate !== todayDate) {
      return HasAbsenceToday(
        false,
        data,
        true,
        false,
        afterOffice,
        lateAbsence,
        null,
        leaveQuota,
        pendingTasks.length,
        unrecordedDays.length,
      );
    }

    return HasAbsenceToday(
      true,
      data,
      false,
      false,
      afterOffice,
      lateAbsence,
      data.id,
      leaveQuota,
      pendingTasks.length,
      unrecordedDays.length,
    );
  }

  async findOneFull(fields: EntityCondition<Absence>) {
    const data = await this.absenceRepository
      .createQueryBuilder('absence')
      .where(fields)
      .getOne();

    return data;
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.absenceRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Absence`,
      ip: ip,
    });
  }

  // ===================== SUMMARY & REVIEWS =====================

  async getMonthlySummary(month: string, until?: string) {
    const yearStr = month.split('-')[0];
    const holidays = await this.getHolidays(parseInt(yearStr, 10));

    const startOfMonth = moment(`${month}-01`).startOf('month');
    const endOfMonth = moment(`${month}-01`).endOf('month');
    const now = moment();

    let cutoffDate = endOfMonth.clone();

    if (until) {
      const parsedUntil = moment(until);
      if (parsedUntil.isValid()) {
        cutoffDate = parsedUntil.clone().endOf('day');
        if (cutoffDate.isAfter(endOfMonth)) {
          cutoffDate = endOfMonth.clone();
        }
        if (cutoffDate.isBefore(startOfMonth)) {
          cutoffDate = startOfMonth.clone().endOf('day');
        }
      }
    } else {
      if (startOfMonth.isSame(now, 'month')) {
        cutoffDate = now.clone().endOf('day');
      } else if (startOfMonth.isAfter(now, 'month')) {
        cutoffDate = startOfMonth.clone().subtract(1, 'day');
      } else {
        cutoffDate = endOfMonth.clone();
      }
    }

    let expectedWorkingDays = 0;
    const currentDay = startOfMonth.clone().startOf('day');
    const effectiveEndDay = cutoffDate.clone().startOf('day');

    while (currentDay.isSameOrBefore(effectiveEndDay)) {
      const dayOfWeek = currentDay.day();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateString = currentDay.format('YYYY-MM-DD');
        if (!holidays.includes(dateString)) {
          expectedWorkingDays++;
        }
      }
      currentDay.add(1, 'day');
    }

    const startOfMonthStr = startOfMonth.format('YYYY-MM-DD 00:00:00');
    const endOfMonthStr = cutoffDate.format('YYYY-MM-DD 23:59:59');

    const absences = await this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.user', 'user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .where('absence.clock_in >= :startOfMonthStr', { startOfMonthStr })
      .andWhere('absence.clock_in <= :endOfMonthStr', { endOfMonthStr })
      .getMany();

    const rawOffices = getFlag('office_locations', '');
    const offices = [];
    if (rawOffices) {
      rawOffices.split('\n').forEach((line) => {
        const parts = line.split('|').map((p) => p.trim());
        if (parts.length === 3) {
          offices.push({
            name: parts[0],
            lat: parseFloat(parts[1]),
            lng: parseFloat(parts[2]),
          });
        }
      });
    }

    const summaryMap = new Map<number, any>();
    const userIdsWithAbsence = [...new Set(absences.map((a) => a.user_id))];

    const query = getManager()
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .where(
        '(LOWER(user.status_description) = :onboard1 OR LOWER(user.status_description) = :onboard2)',
        { onboard1: 'on board', onboard2: 'on bord' },
      );

    if (userIdsWithAbsence.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.level_iresource) = :internal', {
            internal: 'internal',
          }).orWhere(
            '(LOWER(user.level_iresource) = :external AND user.id IN (:...userIdsWithAbsence))',
            { external: 'external', userIdsWithAbsence },
          );
        }),
      );
    } else {
      query.andWhere('LOWER(user.level_iresource) = :internal', {
        internal: 'internal',
      });
    }

    const targetUsers = await query.getMany();

    for (const u of targetUsers) {
      summaryMap.set(u.id, {
        user_id: u.id,
        name: u.name,
        role: u.employeePosition?.name || 'Employee',
        present_dates: new Set<string>(),
        total_present: 0,
        total_absent: 0,
        late_count: 0,
        late_reasons: [],
        total_work_minutes: 0,
        office_counts: {},
        remote_counts: {},
      });
    }

    let geocodeLimit = 15;

    for (const absence of absences) {
      if (!summaryMap.has(absence.user_id)) continue;

      const sum = summaryMap.get(absence.user_id);

      if (absence.clock_in) {
        const dateKey = moment(absence.clock_in).format('YYYY-MM-DD');
        sum.present_dates.add(dateKey);
      }

      if (absence.late_reason) {
        sum.late_count += 1;
        sum.late_reasons.push(absence.late_reason);
      } else {
        const clockInTime = moment(absence.clock_in);
        if (
          clockInTime.hours() > 9 ||
          (clockInTime.hours() === 9 && clockInTime.minutes() > 0)
        ) {
          sum.late_count += 1;
        }
      }

      if (absence.clock_in && absence.clock_out) {
        const diffMinutes = moment(absence.clock_out).diff(
          moment(absence.clock_in),
          'minutes',
        );
        sum.total_work_minutes += diffMinutes;
      }

      let isOffice = false;
      let matchedOfficeName = '';
      let minDistance = 999999;

      for (const off of offices) {
        const dist = this.getDistanceFromLatLonInMeters(
          absence.clock_in_latitude,
          absence.clock_in_longitude,
          off.lat,
          off.lng,
        );
        if (dist < minDistance) {
          minDistance = dist;
          if (dist <= 500) {
            isOffice = true;
            matchedOfficeName = off.name;
          }
        }
      }

      if (isOffice) {
        sum.office_counts[matchedOfficeName] =
          (sum.office_counts[matchedOfficeName] || 0) + 1;
      } else {
        if (
          !absence.clock_in_kecamatan &&
          absence.clock_in_latitude &&
          absence.clock_in_longitude
        ) {
          if (geocodeLimit > 0) {
            const fetchedLocation = await this.getKecamatan(
              absence.clock_in_latitude,
              absence.clock_in_longitude,
            );
            absence.clock_in_kecamatan =
              fetchedLocation || 'Unknown Location';
            await this.absenceRepository.save(absence);
            geocodeLimit--;
          }
        }

        const loc =
          absence.clock_in_kecamatan ||
          'Loading Location... (Refresh later)';
        sum.remote_counts[loc] = (sum.remote_counts[loc] || 0) + 1;
      }
    }

    const results = Array.from(summaryMap.values()).map((sum) => {
      const total_present = sum.present_dates.size;
      const total_absent = Math.max(0, expectedWorkingDays - total_present);

      const avg_minutes =
        total_present > 0 ? sum.total_work_minutes / total_present : 0;
      const avg_hours = Math.floor(avg_minutes / 60);
      const avg_mins = Math.floor(avg_minutes % 60);

      const late_reasons_unique = [...new Set(sum.late_reasons)]
        .filter((r) => r)
        .join(', ');

      let attendance_percentage = 0;
      if (expectedWorkingDays > 0) {
        attendance_percentage = Math.min(
          100,
          parseFloat(
            ((total_present / expectedWorkingDays) * 100).toFixed(1),
          ),
        );
      } else if (total_present > 0) {
        attendance_percentage = 100;
      }

      return {
        name: sum.name,
        role: sum.role,
        total_present: total_present,
        total_absent: total_absent,
        attendance_percentage,
        expected_working_days: expectedWorkingDays,
        late_count: sum.late_count,
        late_reasons: late_reasons_unique,
        avg_hours_formatted: `${avg_hours}h ${avg_mins}m`,
        office_counts: sum.office_counts,
        remote_counts: sum.remote_counts,
      };
    });

    results.sort((a, b) => a.name.localeCompare(b.name));

    return {
      expected_working_days: expectedWorkingDays,
      cutoff_date: cutoffDate.format('YYYY-MM-DD'),
      period_start: startOfMonth.format('YYYY-MM-DD'),
      period_end: cutoffDate.format('YYYY-MM-DD'),
      is_mid_month: cutoffDate.isBefore(endOfMonth, 'day'),
      data: results,
    };
  }

  getOfficeForUser(user: User): { name: string; lat: number; lng: number } {
    const rawOffices = getFlag('office_locations', '');
    const offices: Array<{ name: string; lat: number; lng: number }> = [];
    if (rawOffices) {
      rawOffices.split('\n').forEach((line) => {
        const parts = line.split('|').map((p) => p.trim());
        if (parts.length === 3) {
          offices.push({
            name: parts[0],
            lat: parseFloat(parts[1]),
            lng: parseFloat(parts[2]),
          });
        }
      });
    }

    if (offices.length === 0) {
      return {
        name: 'Biosron West Java Office',
        lat: -6.9005171,
        lng: 107.5835439,
      };
    }

    if (user && user.region) {
      const uRegion = user.region.toLowerCase().trim();
      const matched = offices.find(
        (o) =>
          o.name.toLowerCase().includes(uRegion) ||
          uRegion.includes(
            o.name
              .toLowerCase()
              .replace(/office|biosron|xlsmart/g, '')
              .trim(),
          ),
      );
      if (matched) return matched;
    }

    const defaultWJ = offices.find((o) =>
      o.name.toLowerCase().includes('west java'),
    );
    return defaultWJ || offices[0];
  }

  sendHikvisionAck(req: any, res: any) {
    const requestUrl = req.originalUrl || req.url || '/';
    const ackXml = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus version="1.0" xmlns="http://www.std-cgi.com/ver10/XMLSchema">
  <requestURL>${requestUrl}</requestURL>
  <statusCode>1</statusCode>
  <statusString>OK</statusString>
  <subStatusCode>ok</subStatusCode>
</ResponseStatus>`;

    res.setHeader('Content-Type', 'application/xml; charset="UTF-8"');
    return res.status(HttpStatus.OK).send(ackXml);
  }

  async processMachineEvent(
    req: any,
    body: any,
    files: Array<Express.Multer.File>,
    res: any,
  ) {
    try {
      let eventLog = body?.event_log;
      if (!eventLog && body?.AccessControllerEvent) {
        eventLog = body;
      }

      if (typeof eventLog === 'string') {
        try {
          eventLog = JSON.parse(eventLog);
        } catch (err) {
          const s = eventLog.indexOf('{');
          const e = eventLog.lastIndexOf('}');
          if (s !== -1 && e !== -1) {
            try {
              eventLog = JSON.parse(eventLog.substring(s, e + 1));
            } catch (inner) {}
          }
        }
      }

      const ace = eventLog?.AccessControllerEvent || eventLog;
      const nik = ace?.employeeNoString;

      if (!nik) {
        return this.sendHikvisionAck(req, res);
      }

      const rawEventTime = eventLog?.dateTime;
      const eventDate = rawEventTime ? moment(rawEventTime) : moment();
      const eventTime = eventDate.toDate();

      console.log(
        `[Fingerspot Machine] Processing attendance for NIK: ${nik}, Time: ${eventDate.format(
          'YYYY-MM-DD HH:mm:ss',
        )}`,
      );

      const user = await getManager()
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.nik = :nik', { nik: String(nik).trim() })
        .andWhere('user.deleted_at IS NULL')
        .orderBy(
          "CASE WHEN LOWER(user.status_description) LIKE '%on board%' THEN 0 ELSE 1 END",
          'ASC',
        )
        .addOrderBy('user.id', 'DESC')
        .getOne();

      if (!user) {
        console.warn(
          `[Fingerspot Machine] User with NIK ${nik} not found in database.`,
        );
        return this.sendHikvisionAck(req, res);
      }

      const office = this.getOfficeForUser(user);

      const startOfDay = eventDate.clone().startOf('day').toDate();
      const endOfDay = eventDate.clone().endOf('day').toDate();

      const existingAbsence = await this.absenceRepository
        .createQueryBuilder('absence')
        .where('absence.user_id = :userId', { userId: user.id })
        .andWhere('absence.clock_in >= :startOfDay', { startOfDay })
        .andWhere('absence.clock_in <= :endOfDay', { endOfDay })
        .orderBy('absence.clock_in', 'DESC')
        .getOne();

      const pictureFile = Array.isArray(files)
        ? files.find(
            (f) =>
              f.fieldname === 'Picture' || f.mimetype?.startsWith('image/'),
          )
        : null;

      if (!existingAbsence) {
        let clockInPhotoId: number | null = null;
        if (pictureFile) {
          try {
            const savedFile = await this.fileService.uploadFile(
              pictureFile,
              user.id,
              FilePath.CLOCK_IN,
              'Clock In Fingerspot',
            );
            clockInPhotoId = savedFile.id;
          } catch (fileErr) {
            console.error(
              '[Fingerspot Machine] Failed to save clock-in photo:',
              fileErr.message,
            );
          }
        }

        const isLate =
          eventDate.hours() > 9 ||
          (eventDate.hours() === 9 && eventDate.minutes() > 0);
        const lateReason = isLate ? 'Absen Mesin Fingerspot (Terlambat)' : null;

        const newAbsence = this.absenceRepository.create({
          user_id: user.id,
          absence_type: AbsenceType.CLOCK_IN_OUT,
          status: AbsenceStatus.COMPLETED,
          absence_date: eventDate.format('YYYY-MM-DD'),
          clock_in: eventTime,
          clock_in_latitude: office.lat,
          clock_in_longitude: office.lng,
          clock_in_kecamatan: office.name,
          clock_in_photo: clockInPhotoId,
          source: 'fingerspot',
          clock_in_source: 'fingerspot',
          late_reason: lateReason,
        });

        await this.absenceRepository.save(newAbsence);

        await this.activityLogService.create({
          user_id: user.id,
          description: `Clock In Fingerspot (${office.name})`,
          ip: req.ip || '127.0.0.1',
        });

        console.log(
          `[Fingerspot Machine] Clock-in recorded successfully for ${user.name} (${user.nik})`,
        );
      } else {
        const minutesSinceClockIn = eventDate.diff(
          moment(existingAbsence.clock_in),
          'minutes',
        );
        if (minutesSinceClockIn < 3) {
          console.log(
            `[Fingerspot Machine] Ignored scan for ${user.name} - only ${minutesSinceClockIn} min since clock in.`,
          );
          return this.sendHikvisionAck(req, res);
        }

        let clockOutPhotoId: number | null = existingAbsence.clock_out_photo;
        if (pictureFile) {
          try {
            const savedFile = await this.fileService.uploadFile(
              pictureFile,
              user.id,
              FilePath.CLOCK_OUT,
              'Clock Out Fingerspot',
            );
            clockOutPhotoId = savedFile.id;
          } catch (fileErr) {
            console.error(
              '[Fingerspot Machine] Failed to save clock-out photo:',
              fileErr.message,
            );
          }
        }

        existingAbsence.clock_out = eventTime;
        existingAbsence.clock_out_source = 'fingerspot';
        existingAbsence.clock_out_latitude = office.lat;
        existingAbsence.clock_out_longitude = office.lng;
        existingAbsence.clock_out_kecamatan = office.name;
        existingAbsence.clock_out_photo = clockOutPhotoId;

        if (!existingAbsence.source) {
          existingAbsence.source = 'fingerspot';
        }

        await this.absenceRepository.save(existingAbsence);

        await this.activityLogService.create({
          user_id: user.id,
          description: `Clock Out Fingerspot (${office.name})`,
          ip: req.ip || '127.0.0.1',
        });

        console.log(
          `[Fingerspot Machine] Clock-out recorded successfully for ${user.name} (${user.nik})`,
        );
      }
    } catch (err) {
      console.error('[Fingerspot Machine] Error processing event:', err);
    }

    return this.sendHikvisionAck(req, res);
  }
}
