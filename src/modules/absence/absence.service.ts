import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
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
