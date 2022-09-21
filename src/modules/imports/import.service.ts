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
        .where(`LOWER(role.name) IN (:...role)`, { role: role })
        .getMany();

      role.forEach((element) => {
        const check = dataRole.some(
          (b) => b.name.toLowerCase() == element.toLowerCase(),
        );
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
        .where(`LOWER(unit.name) IN (:...unit)`, { unit: unit })
        .getMany();

      unit.forEach((element) => {
        const check = dataUnit.some(
          (b) => b.name.toLowerCase() == element.toLowerCase(),
        );
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
        .where(`LOWER(level.name) IN (:...level)`, { level: level })
        .getMany();

      level.forEach((element) => {
        const check = dataLevel.some(
          (b) => b.name.toLowerCase() == element.toLowerCase(),
        );
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
        .where(`LOWER(position.name) IN (:...position)`, { position: position })
        .getMany();

      position.forEach((element) => {
        const check = dataPosition.some(
          (b) => b.name.toLowerCase() == element.toLowerCase(),
        );
        if (!check) {
          throw failedResponse(
            HttpStatus.BAD_REQUEST,
            `Jabatan ${element} tidak tersedia`,
          );
        }
      });

      saveData.forEach((element) => {
        element.role = dataRole.find((a) =>
          role.some((b) => a.name.toLowerCase() == b.toLowerCase()),
        ).id;
        element.position_id = dataPosition.find((a) =>
          position.some((b) => a.name.toLowerCase() == b.toLowerCase()),
        ).id;
        element.unit_id = dataUnit.find((a) =>
          unit.some((b) => a.name.toLowerCase() == b.toLowerCase()),
        ).id;
        element.level_id = dataLevel.find((a) =>
          level.some((b) => a.name.toLowerCase() == b.toLowerCase()),
        ).id;
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
            console.log(
              `${!currRow.getCell(1)} | ${!currRow.getCell(2)} | ${
                currRow.getCell(2).toString() != 'Ya' &&
                currRow.getCell(2).toString() != 'Tidak'
              }`,
            );

            if (
              !currRow.getCell(1) ||
              !currRow.getCell(2) ||
              (currRow.getCell(2).toString() != 'Ya' &&
                currRow.getCell(2).toString() != 'Tidak')
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

      const notExistsUser = nip.find((a) => dataUser.some((b) => b.nip == a));

      if (!notExistsUser) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `User dengan NIP ${notExistsUser} tidak tersedia`,
        );
      }

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
}
