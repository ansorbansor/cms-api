import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { User } from 'src/entities/user.entity';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRoles } from 'src/entities/user-role.entity';
import { UserResource } from './resources/user.resources';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { FilesService } from '../files/files.service';
import { BufferedFile } from 'src/utils/file-helper';
import { CreateUserTopicDto } from './dto/create-user-topic.dto';
import { UserTopic } from 'src/entities/user-topic.entity';

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

    return this.findOne({ id: user.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.usersRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.usersRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      UserResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<User>) {
    const data = await this.usersRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'User tidak ditemukan',
      );
    }

    return UserResource(data);
  }

  async findOneFull(fields: EntityCondition<User>) {
    const data = await this.usersRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'User tidak ditemukan',
      );
    } else if (!data.userRole || data.userRole.length == 0) {
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

    return await this.findOne({ id: id });
  }

  async softDelete(id: number): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async createUserTopic(createUserTopicDto: CreateUserTopicDto[], user: User) {
    const saveData = [];
    createUserTopicDto.map((data) => {
      data.topic_id.map((dataa) => {
        saveData.push({
          user_id: user.id,
          category_id: data.category_id,
          topic_id: dataa,
        });
      });
    });

    await this.userTopicsRepository.save(
      this.userTopicsRepository.create(saveData),
    );

    return 'success';
  }
}
