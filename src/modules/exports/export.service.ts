import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workbook } from 'exceljs';
import { User } from 'src/entities/user.entity';
import { failedResponse } from 'src/utils/responses';
import * as tmp from 'tmp';
import { Repository } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';
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
}
