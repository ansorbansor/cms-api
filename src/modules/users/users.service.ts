import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { User } from 'src/entities/user.entity';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRoles } from 'src/entities/user-role.entity';
import { UserResource } from './resources/user.resources';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { FilesService } from '../files/files.service';
import { BufferedFile } from 'src/utils/file-helper';
import { CreateUserTopicDto } from './dto/create-user-topic.dto';
import { UserTopic } from 'src/entities/user-topic.entity';
import { MailService } from '../mail/mail.service';
import { RedisKeyEnum } from 'src/utils/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(UserRoles)
    private userRolesRepository: Repository<UserRoles>,

    @InjectRepository(UserTopic)
    private userTopicsRepository: Repository<UserTopic>,

    private redisService: RedisService,

    private fileService: FilesService,

    private mailService: MailService,
  ) {}

  async create(
    createProfileDto: CreateUserDto,
    user_id?: number,
    photo?: BufferedFile,
  ) {
    if (photo && user_id) {
      const uploadedPhoto = await this.fileService.uploadWithMinio(
        photo,
        user_id,
      );

      createProfileDto.photoFile = uploadedPhoto;
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create(createProfileDto),
    );

    if (photo && !user_id) {
      const uploadedPhoto = await this.fileService.uploadWithMinio(
        photo,
        user_id,
      );

      await this.usersRepository.update(user.id, {
        photo: uploadedPhoto.id,
      });
    }

    await this.userRolesRepository.save(
      this.userRolesRepository.create({
        user_id: user.id,
        role_id: createProfileDto.role_id,
      }),
    );

    if (createProfileDto.categories) {
      await this.createUserTopic(createProfileDto.categories, user.id);
    }

    await this.mailService.welcome({
      to: user.email,
      data: {
        email: user.email,
        password: createProfileDto.password,
      },
    });

    return this.findOne({ id: user.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('user.userCourse', 'userCourse')
      .leftJoinAndSelect('userCourse.course', 'course')
      .leftJoinAndSelect('user.employeeUnit', 'employeeUnit')
      .leftJoinAndSelect('user.employeeLevel', 'employeeLevel')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .leftJoinAndSelect('userRole.roleData', 'role');

    if (paginationOptions.blacklist != undefined) {
      data.where(`user.blacklist = ${paginationOptions.blacklist ? 1 : 0}`);
    }

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(
            `LOWER(user.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          ).orWhere(
            `LOWER(user.nip) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          );
        }),
      );
    }

    if (paginationOptions.employeeUnit) {
      data.andWhere('employeeUnit.id = :unitId', {
        unitId: paginationOptions.employeeUnit,
      });
    }

    if (paginationOptions.employeeLevel) {
      data.andWhere('employeeLevel.id = :levelId', {
        levelId: paginationOptions.employeeLevel,
      });
    }

    if (paginationOptions.employeePosition) {
      data.andWhere('employeePosition.id = :positionId', {
        positionId: paginationOptions.employeePosition,
      });
    }

    if (paginationOptions.role) {
      data.andWhere('role.id = :roleId', {
        roleId: paginationOptions.role,
      });
    }

    const total = await data.getCount();
    paginationOptions.total = total;

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
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.roleData', 'role')
      .leftJoinAndSelect('user.userCourse', 'userCourse')
      .leftJoinAndSelect('userCourse.course', 'course')
      .leftJoinAndSelect('role.roleAccess', 'roleAccess')
      .leftJoinAndSelect('roleAccess.menu', 'menu')
      .leftJoinAndSelect('user.userTopic', 'userTopic')
      .leftJoinAndSelect('userTopic.category', 'category')
      .leftJoinAndSelect('userTopic.topic', 'topic')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .leftJoinAndSelect('user.employeeUnit', 'employeeUnit')
      .leftJoinAndSelect('user.employeeLevel', 'employeeLevel')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
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
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.roleData', 'role')
      .leftJoinAndSelect('user.userCourse', 'userCourse')
      .leftJoinAndSelect('userCourse.course', 'course')
      .leftJoinAndSelect('role.roleAccess', 'roleAccess')
      .leftJoinAndSelect('roleAccess.menu', 'menu')
      .leftJoinAndSelect('user.userTopic', 'userTopic')
      .leftJoinAndSelect('userTopic.category', 'category')
      .leftJoinAndSelect('userTopic.topic', 'topic')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .leftJoinAndSelect('user.employeeUnit', 'employeeUnit')
      .leftJoinAndSelect('user.employeeLevel', 'employeeLevel')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'User tidak ditemukan',
      );
    } else if (!data.userRoles || data.userRoles.length == 0) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'User tidak memiliki role',
      );
    }

    return data;
  }

  async update(
    id: number,
    updateProfileDto: UpdateUserDto,
    photo?: BufferedFile,
  ) {
    const exists = await this.findOne({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'User tidak ditemukan',
      );
    }

    if (updateProfileDto.email) {
      const userWithEmail = await this.findOne({
        email: updateProfileDto.email.toLocaleLowerCase(),
      });

      if (userWithEmail && userWithEmail.id != exists.id) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Email telah digunakan',
        );
      }
    }

    if (updateProfileDto.nip) {
      const userWithNIP = await this.findOne({
        nip: updateProfileDto.nip,
      });

      if (userWithNIP && userWithNIP.id != exists.id) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'NIP telah digunakan',
        );
      }
    }

    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, id);
      updateProfileDto.photo = img.id;
    }

    await this.usersRepository.save(
      this.usersRepository.create({
        id,
        ...updateProfileDto,
      }),
    );

    if (updateProfileDto.categories) {
      await this.createUserTopic(updateProfileDto.categories, id);
    }

    return await this.findOne({ id: id });
  }

  async softDelete(id: number): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async createUserTopic(
    createUserTopicDto: CreateUserTopicDto[],
    userId: number,
  ) {
    const saveData = [];
    createUserTopicDto.map((data) => {
      data.topic_id.map((dataa) => {
        saveData.push({
          user_id: userId,
          category_id: data.category_id,
          topic_id: dataa,
        });
      });
    });

    await this.userTopicsRepository.softDelete({
      user_id: userId,
    });

    await this.userTopicsRepository.save(
      this.userTopicsRepository.create(saveData),
    );

    const redisKey = `${RedisKeyEnum.user}:${userId}`;

    this.redisService.del(redisKey);

    return 'success';
  }
}
