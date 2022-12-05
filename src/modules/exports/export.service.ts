import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workbook } from 'exceljs';
import { User } from 'src/entities/user.entity';
import { ErrorMessage } from 'src/utils/enums';
import { failedResponse } from 'src/utils/responses';
import * as tmp from 'tmp';
import { getManager, Repository } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ExportCouponSubmissionResource } from './resources/export-coupon-submission.resources';
import { ExportUserResource } from './resources/export-user.resources';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) {}

  async exportUser(user: User, ip: string) {
    const data = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('user.userCourse', 'userCourse')
      .leftJoinAndSelect('userCourse.course', 'course')
      .leftJoinAndSelect('user.employeeUnit', 'employeeUnit')
      .leftJoinAndSelect('user.employeeLevel', 'employeeLevel')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .leftJoinAndSelect('userRole.roleData', 'role')
      .getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(Object.values(ExportUserResource(d)));
    });

    //create workbook
    const wb = new Workbook();
    //creste sheet
    const sheet = wb.addWorksheet('sheet1');
    //create header
    rows.unshift(Object.keys(ExportUserResource(data[0])));
    //add rows
    sheet.addRows(rows);

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: 'Pengguna-', postfix: '.xlsx' },
        function _tempFileCreated(err, path) {
          if (err) throw err;

          wb.xlsx
            .writeFile(path)
            .then(() => {
              resolve(path);
            })
            .catch((err) => {
              throw failedResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `error : ${err}`,
              );
            });
        },
      );
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data Pengguna`,
      ip: ip,
    });

    return f;
  }

  async exportCouponSubmission(user: User, ip: string, year: string) {
    const data = await getManager().query(
      `SELECT 
        c.id,
        c.name 'coupon_name', 
        c.code, 
        p.name 'provider_name', 
        c.amount, 
        c.type, 
        c.status, 
        cs.updated_at,
        u.nip,
        u.name 'user_name',
        eu.name 'employee_unit',
        cour.name 'course_name',
        cour.duration,
        uu.name 'approver_name'
      FROM coupons c
      LEFT JOIN providers p
        ON c.provider_id = p.id
      LEFT JOIN coupon_submissions cs
        ON cs.coupon_id = c.id
      LEFT JOIN users u
        ON cs.user_id = u.id
      LEFT JOIN employee_units eu
        ON u.unit_id = eu.id
      LEFT JOIN courses cour
        ON cs.course_id = cour.id
      LEFT JOIN users uu
        ON cs.status_by = uu.id
      ${year ? `WHERE YEAR(c.created_at) = '${year}'` : ''}
      ORDER BY cs.updated_at DESC`,
    );

    if (!data || data.length == 0) {
      throw failedResponse(HttpStatus.BAD_REQUEST, ErrorMessage.DATA_NOT_FOUND);
    }

    const rows = [];
    let count = 0;

    data.forEach((d) => {
      count++;
      d.no = count;
      rows.push(Object.values(ExportCouponSubmissionResource(d)));
    });

    //create workbook
    const wb = new Workbook();
    //creste sheet
    const sheet = wb.addWorksheet('sheet1');
    //create header
    rows.unshift(Object.keys(ExportCouponSubmissionResource(data[0])));
    //add rows
    sheet.addRows(rows);

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: 'Kupon-', postfix: '.xlsx' },
        function _tempFileCreated(err, path) {
          if (err) throw err;

          wb.xlsx
            .writeFile(path)
            .then(() => {
              resolve(path);
            })
            .catch((err) => {
              throw failedResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `error : ${err}`,
              );
            });
        },
      );
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data Kupon`,
      ip: ip,
    });

    return f;
  }
}
