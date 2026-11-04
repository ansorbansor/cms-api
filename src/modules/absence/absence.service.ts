import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { getFlag } from 'src/utils/feature-flags.util';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository, getManager, Brackets } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Absence } from 'src/entities/absence.entity';
import { CreateAbsenceDTO } from './dto/create-absence.dto';
import {
  AbsenceResource,
  AbsenceResourceDetail,
  HasAbsenceToday,
} from './resources/absence.resources';
import { ClockOutAbsenceDTO } from './dto/clock-out-absence.dto';
import moment from 'moment';
import { FilesService } from '../files/files.service';
import { FilePath } from 'src/utils/enums';

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Absence)
    private absenceRepository: Repository<Absence>,
    private activityLogService: ActivityLogService,
    private fileService: FilesService,
  ) { }

  private async getKecamatan(lat: any, lng: any): Promise<string> {
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    if (isNaN(pLat) || isNaN(pLng) || (pLat === 0 && pLng === 0)) return null;

    try {
      // 500ms delay to be polite to the free API
      await new Promise(resolve => setTimeout(resolve, 500));

      const res = await axios.get(
        `https://photon.komoot.io/reverse?lon=${pLng}&lat=${pLat}`
      );
      if (res.data && res.data.features && res.data.features.length > 0) {
        const props = res.data.features[0].properties;
        const locality = props.district || props.county || props.locality || props.name || '';
        const city = props.city || props.state || '';
        
        if (locality && city && locality !== city) {
          return `${locality} - ${city}`;
        }
        return locality || city || null;
      }
    } catch (e) {
      console.error(`[Geocoding] Error fetching kecamatan for ${pLat}, ${pLng}:`, e.message);
    }
    return null;
  }

  private getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) * 1000; // Distance in meters
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  private async getHolidays(year: number): Promise<string[]> {
    try {
      const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(h => h.date);
      }
    } catch (e) {
      console.error(`Error fetching holidays for year ${year}:`, e.message);
    }
    return [];
  }

  async getMonthlySummary(month: string, until?: string) {
    // month format YYYY-MM
    const yearStr = month.split('-')[0];
    const holidays = await this.getHolidays(parseInt(yearStr, 10));

    const startOfMonth = moment(`${month}-01`).startOf('month');
    const endOfMonth = moment(`${month}-01`).endOf('month');
    const now = moment();

    // Determine effective cutoff date for the report
    let cutoffDate = endOfMonth.clone();

    if (until) {
      const parsedUntil = moment(until);
      if (parsedUntil.isValid()) {
        cutoffDate = parsedUntil.clone().endOf('day');
        // Cap cutoffDate so it does not exceed endOfMonth or precede startOfMonth
        if (cutoffDate.isAfter(endOfMonth)) {
          cutoffDate = endOfMonth.clone();
        }
        if (cutoffDate.isBefore(startOfMonth)) {
          cutoffDate = startOfMonth.clone().endOf('day');
        }
      }
    } else {
      // If no explicit until date is provided:
      // If querying the current month, calculate expected working days only up to today
      if (startOfMonth.isSame(now, 'month')) {
        cutoffDate = now.clone().endOf('day');
      } else if (startOfMonth.isAfter(now, 'month')) {
        // Future month: 0 days elapsed
        cutoffDate = startOfMonth.clone().subtract(1, 'day');
      } else {
        // Past month: full month
        cutoffDate = endOfMonth.clone();
      }
    }

    // Calculate expected working days (Mon-Fri, excluding holidays) up to cutoffDate
    let expectedWorkingDays = 0;
    const currentDay = startOfMonth.clone().startOf('day');
    const effectiveEndDay = cutoffDate.clone().startOf('day');

    while (currentDay.isSameOrBefore(effectiveEndDay)) {
      const dayOfWeek = currentDay.day();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 1=Mon, 5=Fri
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

    // Parse office locations
    const rawOffices = getFlag('office_locations', '');
    const offices = [];
    if (rawOffices) {
      rawOffices.split('\n').forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length === 3) {
          offices.push({ name: parts[0], lat: parseFloat(parts[1]), lng: parseFloat(parts[2]) });
        }
      });
    }

    const summaryMap = new Map<number, any>();

    const userIdsWithAbsence = [...new Set(absences.map(a => a.user_id))];

    // Fetch Target Users (Internal + External with absence)
    const query = getManager().getRepository(User).createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .where('(LOWER(user.status_description) = :onboard1 OR LOWER(user.status_description) = :onboard2)', { onboard1: 'on board', onboard2: 'on bord' });

    if (userIdsWithAbsence.length > 0) {
      query.andWhere(new Brackets(qb => {
        qb.where('LOWER(user.level_iresource) = :internal', { internal: 'internal' })
          .orWhere('(LOWER(user.level_iresource) = :external AND user.id IN (:...userIdsWithAbsence))', { external: 'external', userIdsWithAbsence });
      }));
    } else {
      query.andWhere('LOWER(user.level_iresource) = :internal', { internal: 'internal' });
    }

    const targetUsers = await query.getMany();

    // Initialize all target users
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
        remote_counts: {}
      });
    }

    let geocodeLimit = 15; // Max 15 API requests per report generation to avoid timeouts/bans

    for (const absence of absences) {
      if (!summaryMap.has(absence.user_id)) continue;
      
      const sum = summaryMap.get(absence.user_id);
      
      // Track unique present date
      if (absence.clock_in) {
        const dateKey = moment(absence.clock_in).format('YYYY-MM-DD');
        sum.present_dates.add(dateKey);
      }

      // Late calculation
      if (absence.late_reason) {
        sum.late_count += 1;
        sum.late_reasons.push(absence.late_reason);
      } else {
        const clockInTime = moment(absence.clock_in);
        if (clockInTime.hours() > 9 || (clockInTime.hours() === 9 && clockInTime.minutes() > 0)) {
          sum.late_count += 1;
        }
      }

      // Work hours calculation
      if (absence.clock_in && absence.clock_out) {
        const diffMinutes = moment(absence.clock_out).diff(moment(absence.clock_in), 'minutes');
        sum.total_work_minutes += diffMinutes;
      }

      // Location classification
      let isOffice = false;
      let matchedOfficeName = '';
      let minDistance = 999999;
      
      for (const off of offices) {
        const dist = this.getDistanceFromLatLonInMeters(absence.clock_in_latitude, absence.clock_in_longitude, off.lat, off.lng);
        if (dist < minDistance) {
          minDistance = dist;
          if (dist <= 500) {
            isOffice = true;
            matchedOfficeName = off.name;
          }
        }
      }

      if (isOffice) {
        sum.office_counts[matchedOfficeName] = (sum.office_counts[matchedOfficeName] || 0) + 1;
      } else {
        if (!absence.clock_in_kecamatan && absence.clock_in_latitude && absence.clock_in_longitude) {
          if (geocodeLimit > 0) {
            const fetchedLocation = await this.getKecamatan(absence.clock_in_latitude, absence.clock_in_longitude);
            absence.clock_in_kecamatan = fetchedLocation || 'Unknown Location';
            await this.absenceRepository.save(absence);
            geocodeLimit--;
          }
        }
        
        const loc = absence.clock_in_kecamatan || 'Loading Location... (Refresh later)';
        sum.remote_counts[loc] = (sum.remote_counts[loc] || 0) + 1;
      }
    }

    // Format final results and sort alphabetically
    const results = Array.from(summaryMap.values()).map(sum => {
      const total_present = sum.present_dates.size;
      const total_absent = Math.max(0, expectedWorkingDays - total_present);

      const avg_minutes = total_present > 0 ? sum.total_work_minutes / total_present : 0;
      const avg_hours = Math.floor(avg_minutes / 60);
      const avg_mins = Math.floor(avg_minutes % 60);
      
      const late_reasons_unique = [...new Set(sum.late_reasons)].filter(r => r).join(', ');

      let attendance_percentage = 0;
      if (expectedWorkingDays > 0) {
        attendance_percentage = Math.min(
          100,
          parseFloat(((total_present / expectedWorkingDays) * 100).toFixed(1)),
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
        remote_counts: sum.remote_counts
      };
    });

    // Sort by name alphabetically
    results.sort((a, b) => a.name.localeCompare(b.name));

    return {
      expected_working_days: expectedWorkingDays,
      cutoff_date: cutoffDate.format('YYYY-MM-DD'),
      period_start: startOfMonth.format('YYYY-MM-DD'),
      period_end: cutoffDate.format('YYYY-MM-DD'),
      is_mid_month: cutoffDate.isBefore(endOfMonth, 'day'),
      data: results
    };
  }

  async create(
    createAbsenceDTO: CreateAbsenceDTO,
    user_id: number,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const clockInPhoto = files.find((e) => {
      return e.fieldname == 'clock_in_photo';
    });

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
    
    createAbsenceDTO.clock_in_kecamatan = await this.getKecamatan(createAbsenceDTO.clock_in_latitude, createAbsenceDTO.clock_in_longitude);

    const absence = await this.absenceRepository.save(
      this.absenceRepository.create(createAbsenceDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Absence`,
      ip: ip,
    });

    return absence;
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

    const clockOutPhoto = files.find((e) => {
      return e.fieldname == 'clock_out_photo';
    });

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
    clockOutAbsence.clock_out_kecamatan = await this.getKecamatan(clockOutAbsence.clock_out_latitude, clockOutAbsence.clock_out_longitude);

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

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.user', 'user');

    if (paginationOptions.search) {
      data.andWhere('user.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    if (paginationOptions.user_id) {
      data.andWhere('user.id = :userId', {
        userId: paginationOptions.user_id,
      });
    }

    if (paginationOptions.start_date && paginationOptions.end_date) {
      data.andWhere(`absence.clock_in >= :start_date`, {
        start_date: `${paginationOptions.start_date}`,
      });
      data.andWhere(`absence.clock_in <= :end_date`, {
        end_date: `${paginationOptions.end_date}`,
      });
    }

    data.orderBy('absence.id', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      AbsenceResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Absence>) {
    const data = await this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.user', 'user')
      .leftJoinAndSelect('absence.clock_in_photo_file', 'clock_in_photo_file')
      .leftJoinAndSelect('absence.clock_out_photo_file', 'clock_out_photo_file')
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
    // Get the most recent absence for this user, regardless of date
    const data = await this.absenceRepository
      .createQueryBuilder('absence')
      .where('user_id = :userId', {
        userId: userId,
      })
      .orderBy('clock_in', 'DESC')
      .getOne();

    const currTime = moment().toDate().getHours();
    const afterOffice = currTime >= 16;
    const lateAbsence = currTime >= 9;

    // If no absence exists at all, they must clock in
    if (!data) {
      return HasAbsenceToday(
        false,
        data,
        true,
        false,
        afterOffice,
        lateAbsence,
        null,
      );
    }

    // If the latest absence does NOT have a clock_out, they MUST clock out
    if (!data.clock_out) {
      return HasAbsenceToday(
        true,
        data,
        false, // Don't let them clock in
        true,  // Force them to clock out
        afterOffice,
        lateAbsence,
        data.id,
      );
    }

    // If the latest absence IS closed (has clock_out), check if they clocked in TODAY
    const clockInDate = moment(data.clock_in).format('YYYY-MM-DD');
    const todayDate = moment().format('YYYY-MM-DD');
    
    if (clockInDate !== todayDate) {
      // Their last shift was closed, but they haven't clocked in for today yet
      return HasAbsenceToday(
        false, // Technically they don't have an absence for *today* yet
        data,
        true,  // They need to clock in
        false,
        afterOffice,
        lateAbsence,
        null,
      );
    }

    // They have clocked in and out today. They are done.
    return HasAbsenceToday(
      true,
      data,
      false,
      false,
      afterOffice,
      lateAbsence,
      data.id,
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
      const matched = offices.find((o) =>
        o.name.toLowerCase().includes(uRegion) ||
        uRegion.includes(o.name.toLowerCase().replace(/office|biosron|xlsmart/g, '').trim()),
      );
      if (matched) return matched;
    }

    const defaultWJ = offices.find((o) => o.name.toLowerCase().includes('west java'));
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

  async processMachineEvent(req: any, body: any, files: Array<Express.Multer.File>, res: any) {
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

      // Check if this is an AccessControllerEvent
      const ace = eventLog?.AccessControllerEvent || eventLog;
      const nik = ace?.employeeNoString;

      if (!nik) {
        // Device heartbeat, status notification, or door event without NIK
        return this.sendHikvisionAck(req, res);
      }

      const rawEventTime = eventLog?.dateTime;
      const eventDate = rawEventTime ? moment(rawEventTime) : moment();
      const eventTime = eventDate.toDate();

      console.log(`[Fingerspot Machine] Processing attendance for NIK: ${nik}, Time: ${eventDate.format('YYYY-MM-DD HH:mm:ss')}`);

      // Find user by NIK (non-deleted, preferring 'On Board' active users)
      const user = await getManager().getRepository(User).createQueryBuilder('user')
        .where('user.nik = :nik', { nik: String(nik).trim() })
        .andWhere('user.deleted_at IS NULL')
        .orderBy("CASE WHEN LOWER(user.status_description) LIKE '%on board%' THEN 0 ELSE 1 END", 'ASC')
        .addOrderBy('user.id', 'DESC')
        .getOne();

      if (!user) {
        console.warn(`[Fingerspot Machine] User with NIK ${nik} not found in database.`);
        return this.sendHikvisionAck(req, res);
      }

      const office = this.getOfficeForUser(user);

      // Check existing absence for this user on this day
      const startOfDay = eventDate.clone().startOf('day').toDate();
      const endOfDay = eventDate.clone().endOf('day').toDate();

      const existingAbsence = await this.absenceRepository
        .createQueryBuilder('absence')
        .where('absence.user_id = :userId', { userId: user.id })
        .andWhere('absence.clock_in >= :startOfDay', { startOfDay })
        .andWhere('absence.clock_in <= :endOfDay', { endOfDay })
        .orderBy('absence.clock_in', 'DESC')
        .getOne();

      // Check for attached face photo
      const pictureFile = Array.isArray(files)
        ? files.find((f) => f.fieldname === 'Picture' || f.mimetype?.startsWith('image/'))
        : null;

      if (!existingAbsence) {
        // ----------------- CLOCK IN -----------------
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
            console.error('[Fingerspot Machine] Failed to save clock-in photo:', fileErr.message);
          }
        }

        const isLate = eventDate.hours() > 9 || (eventDate.hours() === 9 && eventDate.minutes() > 0);
        const lateReason = isLate ? 'Absen Mesin Fingerspot (Terlambat)' : null;

        const newAbsence = this.absenceRepository.create({
          user_id: user.id,
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

        console.log(`[Fingerspot Machine] Clock-in recorded successfully for ${user.name} (${user.nik})`);
      } else {
        // ----------------- CLOCK OUT -----------------
        // Prevent immediate duplicate scan within 3 minutes of clock-in
        const minutesSinceClockIn = eventDate.diff(moment(existingAbsence.clock_in), 'minutes');
        if (minutesSinceClockIn < 3) {
          console.log(`[Fingerspot Machine] Ignored scan for ${user.name} - only ${minutesSinceClockIn} min since clock in.`);
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
            console.error('[Fingerspot Machine] Failed to save clock-out photo:', fileErr.message);
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

        console.log(`[Fingerspot Machine] Clock-out recorded successfully for ${user.name} (${user.nik})`);
      }
    } catch (err) {
      console.error('[Fingerspot Machine] Error processing event:', err);
    }

    return this.sendHikvisionAck(req, res);
  }
}
