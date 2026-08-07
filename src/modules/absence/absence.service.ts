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

  private async getKecamatan(lat: number, lng: number): Promise<string> {
    if (!lat || !lng) return null;
    try {
      const res = await axios.get(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`,
        { headers: { 'User-Agent': 'PTBiosronSIMPRO/1.0' } }
      );
      if (res.data) {
        // BigDataCloud provides locality, city, principalSubdivision
        const locality = res.data.locality || '';
        const city = res.data.city || res.data.principalSubdivision || '';
        
        if (locality && city && locality !== city) {
          return `${locality} - ${city}`;
        }
        return locality || city || null;
      }
    } catch (e) {
      console.error('[Geocoding] Error fetching kecamatan:', e.message);
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

  async getMonthlySummary(month: string) {
    // month format YYYY-MM
    const startOfMonth = moment(`${month}-01`).startOf('month').format('YYYY-MM-DD HH:mm:ss');
    const endOfMonth = moment(`${month}-01`).endOf('month').format('YYYY-MM-DD HH:mm:ss');

    const absences = await this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.user', 'user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .where('absence.clock_in >= :startOfMonth', { startOfMonth })
      .andWhere('absence.clock_in <= :endOfMonth', { endOfMonth })
      .getMany();

    // Parse office locations
    const rawOffices = getFlag('office_locations', '');
    const offices = [];
    if (rawOffices) {
      rawOffices.split('\\n').forEach(line => {
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
        total_present: 0,
        total_absent: 0, 
        late_count: 0,
        late_reasons: [],
        total_work_minutes: 0,
        office_counts: {},
        remote_counts: {}
      });
    }

    for (const absence of absences) {
      if (!summaryMap.has(absence.user_id)) continue;
      
      const sum = summaryMap.get(absence.user_id);
      sum.total_present += 1;

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
      let foundOffice = null;
      let minDistance = 999999;
      for (const off of offices) {
        const dist = this.getDistanceFromLatLonInMeters(absence.clock_in_latitude, absence.clock_in_longitude, off.lat, off.lng);
        if (dist < minDistance) {
          minDistance = dist;
          if (dist <= 500) {
            foundOffice = off.name;
          }
        }
      }

      if (foundOffice) {
        sum.office_counts[foundOffice] = (sum.office_counts[foundOffice] || 0) + 1;
      } else {
        // Reverse geocoding on the fly if needed
        let kec = absence.clock_in_kecamatan;
        if (!kec) {
          kec = await this.getKecamatan(absence.clock_in_latitude, absence.clock_in_longitude);
          if (kec) {
            // save it back silently so next time it's faster
            await this.absenceRepository.update(absence.id, { clock_in_kecamatan: kec });
            absence.clock_in_kecamatan = kec;
          } else {
            kec = 'Unknown Location';
          }
        }
        sum.remote_counts[kec] = (sum.remote_counts[kec] || 0) + 1;
      }
    }

    // Format final results and sort alphabetically
    const results = Array.from(summaryMap.values()).map(sum => {
      const avg_minutes = sum.total_present > 0 ? sum.total_work_minutes / sum.total_present : 0;
      const avg_hours = Math.floor(avg_minutes / 60);
      const avg_mins = Math.floor(avg_minutes % 60);
      
      const late_reasons_unique = [...new Set(sum.late_reasons)].filter(r => r).join(', ');

      return {
        name: sum.name,
        role: sum.role,
        total_present: sum.total_present,
        total_absent: sum.total_absent,
        late_count: sum.late_count,
        late_reasons: late_reasons_unique,
        avg_hours_formatted: `${avg_hours}h ${avg_mins}m`,
        office_counts: sum.office_counts,
        remote_counts: sum.remote_counts
      };
    });

    // Sort by name alphabetically
    results.sort((a, b) => a.name.localeCompare(b.name));

    return results;
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
}
