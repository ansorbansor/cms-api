import { HttpStatus, Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Workbook } from 'exceljs';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { BufferedFile } from 'src/utils/file-helper';
import { failedResponse } from 'src/utils/responses';
import { Stream } from 'stream';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import * as tmp from 'tmp';
import { MasterRoleResource } from './resource/master-role.resources';
import { MasterEmployeePositionResource } from './resource/master-employee-position.resources';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UserRoles } from 'src/entities/user-role.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(EmployeePosition)
    private employeePositionRepository: Repository<EmployeePosition>,
    @InjectRepository(UserRoles)
    private userRoleRepository: Repository<UserRoles>,
    private mailService: MailService,
    private activityLogService: ActivityLogService,
  ) {}

  async importUser(file: BufferedFile, user: User, ip: string) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    const nik = [];
    const email = [];
    const role = [];
    const position = [];

    const saveData = [];
    const roleSaveData = [];
    const workbook = new Workbook();
    const stream = new Stream.Readable();
    stream.push(file.buffer); // file is ArrayBuffer variable
    stream.push(null); //set end of file
    await workbook.xlsx.read(stream).then(function () {
      const worksheet = workbook.getWorksheet('uploads');
      if (worksheet) {
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          const currRow = worksheet.getRow(rowNumber);
          if (
            rowNumber > 1 &&
            currRow.getCell(1).text &&
            currRow.getCell(2).text &&
            currRow.getCell(3).text &&
            currRow.getCell(4).text &&
            currRow.getCell(5).text &&
            currRow.getCell(6).text &&
            currRow.getCell(7).text &&
            currRow.getCell(8).text &&
            currRow.getCell(9).text &&
            currRow.getCell(10).text
          ) {
            nik.push(currRow.getCell(1).text);
            email.push(currRow.getCell(3).text);
            role.push(String(currRow.getCell(5).text).toLowerCase());
            position.push(String(currRow.getCell(9).text).toLowerCase());

            roleSaveData.push({
              nik: currRow.getCell(1).text,
              role_id: currRow.getCell(5).text,
            });

            saveData.push({
              nik: currRow.getCell(1).text,
              name: currRow.getCell(2).text,
              email: currRow.getCell(3).text,
              status:
                currRow.getCell(4).text && currRow.getCell(4).text == 'Aktif',
              role: currRow.getCell(5).text,
              blacklist:
                currRow.getCell(6).text && currRow.getCell(6).text == 'Ya',
              position_id: currRow.getCell(9).text,
              provider: 'email',
              password: randomStringGenerator(),
              generatePassword: true,
            });
          }
        });
      } else {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Sheet tidak sesuai');
      }
    });

    if (saveData.length > 0) {
      //check nik and email not used
      const dataUser = await this.usersRepository
        .createQueryBuilder('user')
        .where(`user.nik IN (:...nik)`, { nik: nik })
        .orWhere(`user.email IN (:...email)`, { email: email })
        .getOne();

      if (dataUser) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Pengguna dengan NIK ${dataUser.nik} atau email ${dataUser.email} sudah ada.`,
        );
      }

      //check role exists
      const dataRole = await this.roleRepository
        .createQueryBuilder('role')
        .where(`role.id IN (:...role)`, { role: role })
        .getMany();

      role.forEach((element) => {
        const check = dataRole.some((b) => b.id == element.toLowerCase());
        if (!check) {
          throw failedResponse(
            HttpStatus.BAD_REQUEST,
            `Role ${element} tidak tersedia`,
          );
        }
      });

      //check position exists
      const dataPosition = await this.employeePositionRepository
        .createQueryBuilder('position')
        .where(`position.id IN (:...position)`, { position: position })
        .getMany();

      position.forEach((element) => {
        const check = dataPosition.some((b) => b.id == element);
        if (!check) {
          throw failedResponse(
            HttpStatus.BAD_REQUEST,
            `Jabatan ${element} tidak tersedia`,
          );
        }
      });

      const savedData = await this.usersRepository.save(
        this.usersRepository.create(saveData),
      );

      savedData.forEach(async (user) => {
        await this.mailService.welcome({
          to: user.email,
          data: {
            email: user.email,
            password: user.password,
          },
        });

        await this.userRoleRepository.save(
          this.userRoleRepository.create({
            user_id: user.id,
            role_id: roleSaveData.find((e) => e.nik == user.nik).role_id,
          }),
        );
      });

      await this.activityLogService.create({
        user_id: user.id,
        description: `Tambah ${saveData.length} Pengguna by Spreadsheet`,
        ip: ip,
      });

      return `Berhasil menambah ${saveData.length} data pengguna`;
    } else {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Harap isi data terlebih dahulu',
      );
    }
  }

  async downloadTemplate(name: string) {
    //create workbook
    const wb = new Workbook();

    let rows = [];
    let prefix = '';

    //set header and prefix file
    switch (name) {
      case 'user': {
        rows = [
          {
            header: 'NIK',
            key: 'nik',
            width: 18,
            style: { numFmt: '@' },
          },
          { header: 'Nama', key: 'name', width: 18 },
          { header: 'Email', key: 'email', width: 18, style: { numFmt: '@' } },
          {
            header: 'Status',
            key: 'status',
            width: 18,
          },
          {
            header: 'Peran Pengguna',
            key: 'role',
            width: 18,
          },
          {
            header: 'Blacklist',
            key: 'blacklist',
            width: 18,
          },
          {
            header: 'Jabatan',
            key: 'position',
            width: 18,
          },
        ];
        prefix = 'TemplateImportUser-';
        break;
      }
      default: {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Tipe tidak tersedia');
      }
    }

    //create sheet
    const sheet = wb.addWorksheet('uploads');
    //add header
    sheet.columns = rows;

    //set comment header and inser additional sheet master data
    switch (name) {
      case 'user': {
        sheet.getCell('A1').note = 'Diisi NIK pengguna';
        sheet.getCell('B1').note = 'Diisi nama pengguna';
        sheet.getCell('C1').note = 'Diisi email pengguna';
        sheet.getCell('D1').note = 'Diisi status "Aktif" atau "Tidak Aktif"';
        sheet.getCell('E1').note = 'Diisi ID peran pengguna';
        sheet.getCell('I1').note = 'Diisi ID jabatan pengguna';

        //role master data
        const roleSheet = wb.addWorksheet('Daftar Peran Pengguna');
        const roleData = await this.roleRepository
          .createQueryBuilder('role')
          .getMany();

        let rows = [];

        roleData.forEach((d) => {
          rows.push(Object.values(MasterRoleResource(d)));
        });

        rows.unshift(Object.keys(MasterRoleResource(roleData[0])));

        roleSheet.addRows(rows);

        //employee position master data
        const employeePositionSheet = wb.addWorksheet('Daftar Jabatan');
        const employeePositionData = await this.employeePositionRepository
          .createQueryBuilder('employeePosition')
          .getMany();

        rows = [];

        employeePositionData.forEach((d) => {
          rows.push(Object.values(MasterEmployeePositionResource(d)));
        });

        rows.unshift(
          Object.keys(MasterEmployeePositionResource(employeePositionData[0])),
        );

        employeePositionSheet.addRows(rows);
        break;
      }
    }

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: prefix, postfix: '.xlsx' },
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

    return f;
  }
}
