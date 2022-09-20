import { HttpStatus, Injectable } from '@nestjs/common';
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
              status: currRow.getCell(4).value,
              role: currRow.getCell(5).value,
              blacklist: currRow.getCell(6).value,
              unit_id: currRow.getCell(7).value,
              level_id: currRow.getCell(8).value,
              position_id: currRow.getCell(9).value,
              provider: 'email',
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

      const notExistsRole = role.find((a) =>
        dataRole.some((b) => b.name.toLowerCase() != a.toLowerCase()),
      );

      if (notExistsRole) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Role ${notExistsRole} tidak tersedia`,
        );
      }

      //check unit exists
      const dataUnit = await this.employeeUnitRepository
        .createQueryBuilder('unit')
        .where(`LOWER(unit.name) IN (:...unit)`, { unit: unit })
        .getMany();

      const notExistsUnit = unit.find((a) =>
        dataUnit.some((b) => b.name.toLowerCase() != a.toLowerCase()),
      );

      if (notExistsUnit) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Unit ${notExistsUnit} tidak tersedia`,
        );
      }

      //check level exists
      const dataLevel = await this.employeeLevelRepository
        .createQueryBuilder('level')
        .where(`LOWER(level.name) IN (:...level)`, { level: level })
        .getMany();

      const notExistsLevel = level.find((a) =>
        dataLevel.some((b) => b.name.toLowerCase() != a.toLowerCase()),
      );

      if (notExistsLevel) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Pangkat ${notExistsLevel} tidak tersedia`,
        );
      }

      //check position exists
      const dataPosition = await this.employeePositionRepository
        .createQueryBuilder('position')
        .where(`LOWER(position.name) IN (:...position)`, { position: position })
        .getMany();

      const notExistsPosition = position.find((a) =>
        dataPosition.some((b) => b.name.toLowerCase() != a.toLowerCase()),
      );

      if (notExistsPosition) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Jabatan ${notExistsPosition} tidak tersedia`,
        );
      }

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

      const users = await this.usersRepository.save(
        this.usersRepository.create(saveData),
      );

      users.forEach(async (user) => {
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
}
