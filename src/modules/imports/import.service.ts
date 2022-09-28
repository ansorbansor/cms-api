import { HttpStatus, Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Workbook } from 'exceljs';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { BufferedFile } from 'src/utils/file-helper';
import { failedResponse } from 'src/utils/responses';
import { Stream } from 'stream';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import * as tmp from 'tmp';
import { Provider } from 'src/entities/provider.entity';
import { Course } from 'src/entities/course.entity';
import { MasterProviderResource } from './resource/master-provider.resources';
import { MasterCourseResource } from './resource/master-course.resources';
import { MasterRoleResource } from './resource/master-role.resources';
import { MasterEmployeeUnitResource } from './resource/master-employee-unit.resources';
import { MasterEmployeeLevelResource } from './resource/master-employee-level.resources';
import { MasterEmployeePositionResource } from './resource/master-employee-position.resources';
import { Coupon } from 'src/entities/coupon.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(EmployeeUnit)
    private employeeUnitRepository: Repository<EmployeeUnit>,
    @InjectRepository(EmployeeLevel)
    private employeeLevelRepository: Repository<EmployeeLevel>,
    @InjectRepository(EmployeePosition)
    private employeePositionRepository: Repository<EmployeePosition>,
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private mailService: MailService,
  ) {}

  async importUser(file: BufferedFile) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    const nip = [];
    const email = [];
    const role = [];
    const unit = [];
    const level = [];
    const position = [];

    const saveData = [];
    const workbook = new Workbook();
    const stream = new Stream.Readable();
    stream.push(file.buffer); // file is ArrayBuffer variable
    stream.push(null); //set end of file
    await workbook.xlsx.read(stream).then(function () {
      const worksheet = workbook.getWorksheet('uploads');
      if (worksheet) {
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          const currRow = worksheet.getRow(rowNumber);
          if (rowNumber > 1 && currRow.getCell(1).value != null) {
            nip.push(currRow.getCell(1).value);
            email.push(currRow.getCell(3).value);
            role.push(String(currRow.getCell(5).value).toLowerCase());
            unit.push(String(currRow.getCell(7).value).toLowerCase());
            level.push(String(currRow.getCell(8).value).toLowerCase());
            position.push(String(currRow.getCell(9).value).toLowerCase());

            saveData.push({
              nip: currRow.getCell(1).value,
              name: currRow.getCell(2).value,
              email: currRow.getCell(3).value,
              status:
                currRow.getCell(4).value && currRow.getCell(4).value == 'Aktif',
              role: currRow.getCell(5).value,
              blacklist:
                currRow.getCell(6).value && currRow.getCell(6).value == 'Ya',
              unit_id: currRow.getCell(7).value,
              level_id: currRow.getCell(8).value,
              position_id: currRow.getCell(9).value,
              provider: 'email',
              level: currRow.getCell(10).value,
              password: randomStringGenerator(),
            });
          }
        });
      } else {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Sheet tidak sesuai');
      }
    });

    if (saveData.length > 0) {
      //check nip and email not used
      const dataUser = await this.usersRepository
        .createQueryBuilder('user')
        .where(`user.nip IN (:...nip)`, { nip: nip })
        .orWhere(`user.email IN (:...email)`, { email: email })
        .getOne();

      if (dataUser) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Pengguna dengan NIP ${dataUser.nip} atau email ${dataUser.email} sudah ada.`,
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

      //check unit exists
      const dataUnit = await this.employeeUnitRepository
        .createQueryBuilder('unit')
        .where(`unit.id IN (:...unit)`, { unit: unit })
        .getMany();

      unit.forEach((element) => {
        const check = dataUnit.some((b) => b.id == element);
        if (!check) {
          throw failedResponse(
            HttpStatus.BAD_REQUEST,
            `Unit ${element} tidak tersedia`,
          );
        }
      });

      //check level exists
      const dataLevel = await this.employeeLevelRepository
        .createQueryBuilder('level')
        .where(`level.id IN (:...level)`, { level: level })
        .getMany();

      level.forEach((element) => {
        const check = dataLevel.some((b) => b.id == element);
        if (!check) {
          throw failedResponse(
            HttpStatus.BAD_REQUEST,
            `Pangkat ${element} tidak tersedia`,
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

      await this.usersRepository.save(this.usersRepository.create(saveData));

      saveData.forEach(async (user) => {
        await this.mailService.welcome({
          to: user.email,
          data: {
            email: user.email,
            password: user.password,
          },
        });
      });

      return `Berhasil menambah ${saveData.length} data pengguna`;
    }
  }

  async importBlacklistUser(file: BufferedFile) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    const nip = [];

    const saveData = [];
    const workbook = new Workbook();
    const stream = new Stream.Readable();
    stream.push(file.buffer); // file is ArrayBuffer variable
    stream.push(null); //set end of file
    await workbook.xlsx.read(stream).then(function () {
      const worksheet = workbook.getWorksheet('uploads');
      if (worksheet) {
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          const currRow = worksheet.getRow(rowNumber);
          if (rowNumber > 1 && currRow.getCell(1).value != null) {
            if (
              !currRow.getCell(1).value ||
              !currRow.getCell(2).value ||
              (currRow.getCell(2).value.toString() != 'Ya' &&
                currRow.getCell(2).value.toString() != 'Tidak')
            ) {
              throw failedResponse(
                HttpStatus.BAD_REQUEST,
                'Kolom tidak sesuai',
              );
            }

            nip.push(currRow.getCell(1).value);
            saveData.push({
              nip: currRow.getCell(1).value,
              blacklist:
                currRow.getCell(2).value && currRow.getCell(2).value == 'Ya',
            });
          }
        });
      } else {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Sheet tidak sesuai');
      }
    });

    if (saveData.length > 0) {
      //check nip is exists
      const dataUser = await this.usersRepository
        .createQueryBuilder('user')
        .where(`user.nip IN (:...nip)`, { nip: nip })
        .getMany();

      nip.forEach((element) => {
        const check = dataUser.some((b) => b.nip.toLowerCase() == element);
        if (!check) {
          throw failedResponse(
            HttpStatus.BAD_REQUEST,
            `User dengan NIP ${element} tidak tersedia`,
          );
        }
      });

      saveData.forEach(async (user) => {
        await this.usersRepository.update(
          { nip: user.nip },
          {
            blacklist: user.blacklist,
          },
        );
      });

      return `Berhasil mengubah data blacklist ${saveData.length} data pengguna`;
    }
  }

  async importLevelUser(file: BufferedFile) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    const nip = [];

    const saveData = [];
    const workbook = new Workbook();
    const stream = new Stream.Readable();
    stream.push(file.buffer); // file is ArrayBuffer variable
    stream.push(null); //set end of file
    await workbook.xlsx.read(stream).then(function () {
      const worksheet = workbook.getWorksheet('uploads');
      if (worksheet) {
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          const currRow = worksheet.getRow(rowNumber);
          if (rowNumber > 1 && currRow.getCell(1).value != null) {
            if (
              !Number(currRow.getCell(1).value) ||
              !Number(currRow.getCell(2).value) ||
              Number(currRow.getCell(2).value) < 0 ||
              Number(currRow.getCell(2).value) > 5
            ) {
              throw failedResponse(
                HttpStatus.BAD_REQUEST,
                'Level antara 0 sampai 5',
              );
            }

            nip.push(currRow.getCell(1).value);
            saveData.push({
              nip: currRow.getCell(1).value,
              level: currRow.getCell(2).value,
            });
          }
        });
      } else {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Sheet tidak sesuai');
      }
    });

    if (saveData.length > 0) {
      //check nip is exists
      const dataUser = await this.usersRepository
        .createQueryBuilder('user')
        .where(`user.nip IN (:...nip)`, { nip: nip })
        .getMany();

      nip.forEach((element) => {
        const check = dataUser.some((b) => b.nip.toLowerCase() == element);
        if (!check) {
          throw failedResponse(
            HttpStatus.BAD_REQUEST,
            `User dengan NIP ${element} tidak tersedia`,
          );
        }
      });

      saveData.forEach(async (user) => {
        await this.usersRepository.update(
          { nip: user.nip },
          {
            level: user.level,
          },
        );
      });

      return `Berhasil mengubah data level ${saveData.length} data pengguna`;
    }
  }

  async importCoupon(file: BufferedFile) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    const coupon_name = [];
    const coupon_code = [];
    const provider_id = [];
    const course_id = [];

    const saveData = [];
    const workbook = new Workbook();
    const stream = new Stream.Readable();
    stream.push(file.buffer); // file is ArrayBuffer variable
    stream.push(null); //set end of file
    await workbook.xlsx.read(stream).then(function () {
      const worksheet = workbook.getWorksheet('uploads');
      if (worksheet) {
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          const currRow = worksheet.getRow(rowNumber);
          if (rowNumber > 1 && currRow.getCell(1).value != null) {
            coupon_name.push(String(currRow.getCell(1).value));
            coupon_code.push(String(currRow.getCell(2).value));
            provider_id.push(currRow.getCell(3).value);

            if (currRow.getCell(5).value) {
              course_id.push(currRow.getCell(5).value);
            }

            saveData.push({
              name: currRow.getCell(1).value,
              code: currRow.getCell(2).value,
              provider_id: currRow.getCell(3).value,
              amount: currRow.getCell(4).value,
              type: currRow.getCell(5).value ? 1 : 0,
              course_id: currRow.getCell(5).value,
              status: currRow.getCell(6).value,
              start_date: currRow.getCell(7).value,
              end_date: currRow.getCell(8).value,
            });
          }
        });
      } else {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Sheet tidak sesuai');
      }
    });

    if (saveData.length > 0) {
      //check coupon name and code not exists
      const dataCoupon = await this.couponRepository
        .createQueryBuilder('coupon')
        .where(`coupon.name IN (:...name)`, { name: coupon_name })
        .orWhere(`coupon.code IN (:...code)`, { code: coupon_code })
        .getOne();

      if (dataCoupon) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Kupon dengan Nama ${dataCoupon.name} atau kode ${dataCoupon.code} sudah ada.`,
        );
      }

      //check course exists
      if (course_id.length > 0) {
        const dataCourse = await this.courseRepository
          .createQueryBuilder('course')
          .where(`course.id IN (:...course)`, { course: course_id })
          .getMany();

        course_id.forEach((element) => {
          const check = dataCourse.some((b) => b.id == element);
          if (!check) {
            throw failedResponse(
              HttpStatus.BAD_REQUEST,
              `Pembelajaran ${element} tidak tersedia`,
            );
          }
        });
      }

      await this.couponRepository.save(this.couponRepository.create(saveData));

      return `Berhasil menambah ${saveData.length} data kupon`;
    }
  }

  async downloadTemplate(name: string) {
    //create workbook
    const wb = new Workbook();

    let rows = [];
    let prefix = '';

    //set header and prefix file
    switch (name) {
      case 'coupon': {
        rows = [
          { header: 'Nama Coupon', key: 'coupon_name', width: 18 },
          { header: 'Kode Kupon', key: 'coupon_code', width: 18 },
          { header: 'ID Penyelenggara', key: 'provider_id', width: 18 },
          {
            header: 'Nominal',
            key: 'amount',
            width: 18,
          },
          {
            header: 'ID Pembelajaran',
            key: 'course_id',
            width: 18,
          },
          {
            header: 'Status',
            key: 'status',
            width: 18,
          },
          {
            header: 'Berlaku Dari',
            key: 'start_date',
            style: { numFmt: 'YYYY-MM-DD HH:mm:ss' },
            width: 18,
          },
          {
            header: 'Berlaku Sampai',
            key: 'end_date',
            style: { numFmt: 'YYYY-MM-DD HH:mm:ss' },
            width: 18,
          },
        ];
        prefix = 'TemplateImportCoupon-';
        break;
      }
      case 'user': {
        rows = [
          {
            header: 'NIP',
            key: 'nip',
            width: 18,
            style: { numFmt: '@' },
          },
          { header: 'Nama', key: 'name', width: 18 },
          { header: 'Email', key: 'email', width: 18 },
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
            header: 'Unit',
            key: 'unit',
            width: 18,
          },
          {
            header: 'Pangkat',
            key: 'level',
            width: 18,
          },
          {
            header: 'Jabatan',
            key: 'position',
            width: 18,
          },
          {
            header: 'Level Pengguna',
            key: 'user_level',
            width: 18,
          },
        ];
        prefix = 'TemplateImportUser-';
        break;
      }
      case 'user-level': {
        rows = [
          { header: 'NIP', key: 'nip', width: 18, style: { numFmt: '@' } },
          {
            header: 'Level Pengguna',
            key: 'user_level',
            width: 18,
          },
        ];
        prefix = 'TemplateImportUserLevel-';
        break;
      }
      case 'user-blacklist': {
        rows = [
          { header: 'NIP', key: 'nip', width: 18, style: { numFmt: '@' } },
          {
            header: 'Blacklist',
            key: 'user_blacklist',
            width: 18,
          },
        ];
        prefix = 'TemplateImportUserBlacklist-';
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
      case 'coupon': {
        sheet.getCell('A1').note = 'Diisi nama kupon';
        sheet.getCell('B1').note = 'Diisi kode kupon';
        sheet.getCell('C1').note = 'Diisi ID penyelenggara';
        sheet.getCell('D1').note = 'Diisi nominal kupon';
        sheet.getCell('E1').note =
          'Diisi ID pembelajaran (jika hanya berlaku untuk 1 pembelajaran)';
        sheet.getCell('F1').note =
          'Diisi status kupon (tersedia = 0, terpakai = 1, tidak tersedia = 2)';
        sheet.getCell('G1').note =
          'Diisi tanggal mulai berlaku kupon (contoh: 2022-01-23 23:59:59)';
        sheet.getCell('H1').note =
          'Diisi tanggal berakhir berlaku kupon (contoh: 2022-01-27 23:59:59)';

        //provider master data
        const providerSheet = wb.addWorksheet('Daftar Penyelenggara');
        const providerData = await this.providerRepository
          .createQueryBuilder('provider')
          .getMany();

        let rows = [];

        providerData.forEach((d) => {
          rows.push(Object.values(MasterProviderResource(d)));
        });

        rows.unshift(Object.keys(MasterProviderResource(providerData[0])));

        providerSheet.addRows(rows);

        //course master data
        const courseSheet = wb.addWorksheet('Daftar Pembelajaran');
        const courseData = await this.courseRepository
          .createQueryBuilder('course')
          .leftJoinAndSelect('course.provider', 'provider')
          .leftJoinAndSelect('course.courseCategory', 'category')
          .leftJoinAndSelect('course.topic', 'topic')
          .leftJoinAndSelect('course.courseLevel', 'courseLevel')
          .leftJoinAndSelect('course.courseLanguage', 'courseLanguage')
          .leftJoinAndSelect('course.coursePrice', 'coursePrice')
          .leftJoinAndSelect('course.photoFile', 'photoFile')
          .getMany();

        rows = [];

        courseData.forEach((d) => {
          rows.push(Object.values(MasterCourseResource(d)));
        });

        rows.unshift(Object.keys(MasterCourseResource(courseData[0])));

        courseSheet.addRows(rows);
        break;
      }
      case 'user': {
        sheet.getCell('A1').note = 'Diisi NIP pengguna';
        sheet.getCell('B1').note = 'Diisi nama pengguna';
        sheet.getCell('C1').note = 'Diisi email pengguna';
        sheet.getCell('D1').note = 'Diisi status "Aktif" atau "Tidak Aktif"';
        sheet.getCell('E1').note = 'Diisi ID peran pengguna';
        sheet.getCell('F1').note = 'Diisi "Ya" atau "Tidak"';
        sheet.getCell('G1').note = 'Diisi ID unit pengguna';
        sheet.getCell('H1').note = 'Diisi ID pangkat pengguna';
        sheet.getCell('I1').note = 'Diisi ID jabatan pengguna';
        sheet.getCell('J1').note = 'Diisi level pengguna (0-5)';

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

        //employee unit master data
        const employeeUnitSheet = wb.addWorksheet('Daftar Unit');
        const employeeUnitData = await this.employeeUnitRepository
          .createQueryBuilder('employeeUnit')
          .getMany();

        rows = [];

        employeeUnitData.forEach((d) => {
          rows.push(Object.values(MasterEmployeeUnitResource(d)));
        });

        rows.unshift(
          Object.keys(MasterEmployeeUnitResource(employeeUnitData[0])),
        );

        employeeUnitSheet.addRows(rows);

        //employee level master data
        const employeeLevelSheet = wb.addWorksheet('Daftar Pangkat');
        const employeeLevelData = await this.employeeLevelRepository
          .createQueryBuilder('employeeLevel')
          .getMany();

        rows = [];

        employeeLevelData.forEach((d) => {
          rows.push(Object.values(MasterEmployeeLevelResource(d)));
        });

        rows.unshift(
          Object.keys(MasterEmployeeLevelResource(employeeLevelData[0])),
        );

        employeeLevelSheet.addRows(rows);

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
      case 'user-level': {
        sheet.getCell('A1').note = 'Diisi NIP pengguna';
        sheet.getCell('B1').note = 'Diisi level pengguna (0-5)';
        break;
      }
      case 'user-blacklist': {
        sheet.getCell('A1').note = 'Diisi NIP pengguna';
        sheet.getCell('B1').note = 'Diisi "Ya" atau "Tidak"';
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
