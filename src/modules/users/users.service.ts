import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { User } from 'src/entities/user.entity';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, getManager, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResource } from './resources/user.resources';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { FilesService } from '../files/files.service';
import { BufferedFile } from 'src/utils/file-helper';
import { MailService } from '../mail/mail.service';
import { FilePath } from 'src/utils/enums';
import { ActivityLogService } from '../activity-log/activity-log.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private fileService: FilesService,

    private mailService: MailService,

    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createProfileDto: CreateUserDto,
    user_id?: number,
    photo?: BufferedFile,
    ip?: string,
  ) {
    if (photo && user_id) {
      const uploadedPhoto = await this.fileService.uploadFile(
        photo,
        user_id,
        FilePath.USER,
        'User Photo',
      );

      createProfileDto.photoFile = uploadedPhoto;
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create(createProfileDto),
    );

    if (photo && !user_id) {
      const uploadedPhoto = await this.fileService.uploadFile(
        photo,
        user_id,
        FilePath.USER,
        'User Photo',
      );

      await this.usersRepository.update(user.id, {
        photo: uploadedPhoto.id,
      });
    }

    if (user_id) {
      await this.activityLogService.create({
        user_id: user_id,
        description: `Tambah Pengguna ${user.email}`,
        ip: ip,
      });
    } else {
      await this.activityLogService.create({
        user_id: user.id,
        description: `Pendaftaran Pengguna ${user.email}`,
        ip: ip,
      });
    }

    return this.findOneFull({ id: user.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .where('status = true');

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(`LOWER(user.name) LIKE :search`, {
            search: `%${paginationOptions.search.toLowerCase()}%`,
          }).orWhere(`LOWER(user.nik) LIKE :search`, {
            search: `%${paginationOptions.search.toLowerCase()}%`,
          });
        }),
      );
    }

    if (paginationOptions.employeePosition) {
      data.andWhere('employeePosition.id = :positionId', {
        positionId: paginationOptions.employeePosition,
      });
    }
    data.orderBy('user.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      UserResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<User>) {
    const data = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .leftJoinAndSelect('employeePosition.roleAccess', 'roleAccess')
      .leftJoinAndSelect('roleAccess.menu', 'menu')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'User tidak ditemukan',
      );
    }

    return UserResource(data);
  }

  async findOneFull(fields: EntityCondition<User>) {
    const data = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .leftJoinAndSelect('employeePosition.roleAccess', 'roleAccess')
      .leftJoinAndSelect('roleAccess.menu', 'menu')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .addSelect('user.project')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateProfileDto: UpdateUserDto,
    user: User,
    ip: string,
    photo?: BufferedFile,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'User tidak ditemukan',
      );
    }

    if (updateProfileDto.email) {
      const userWithEmail = await this.findOneFull({
        email: updateProfileDto.email.toLocaleLowerCase(),
      });

      if (userWithEmail && userWithEmail.id != exists.id) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Email telah digunakan',
        );
      }
    }

    if (updateProfileDto.nik) {
      const userWithEmail = await this.findOneFull({
        email: updateProfileDto.email,
      });

      if (userWithEmail && userWithEmail.id != exists.id) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'NIK telah digunakan',
        );
      }
    }

    if (
      updateProfileDto.password == '' ||
      updateProfileDto.password == undefined
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...saveData } = updateProfileDto;
      updateProfileDto = saveData;
    }

    if (photo) {
      const img = await this.fileService.uploadFile(
        photo,
        id,
        FilePath.USER,
        'User Photo',
      );
      updateProfileDto.photo = img.id;
    }

    if (updateProfileDto.password) {
      const salt = await bcrypt.genSalt();
      updateProfileDto.password = await bcrypt.hash(
        updateProfileDto.password,
        salt,
      );
    }

    await this.usersRepository.update(id, {
      ...updateProfileDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data User ${exists.email}`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    const deletedData = await this.findOne({ id: id });

    await this.usersRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data User ${deletedData.email}`,
      ip: ip,
    });
  }

  async logout(user: User, ip: string): Promise<void> {
    //revoked token

    //disable notification
    await this.usersRepository.update(user.id, {
      notification_token: null,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Melakukan logout`,
      ip: ip,
    });
  }
}
