import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { UserNotification } from 'src/entities/user-notification.entity';
import { CreateUserNotificationDto } from './dto/create-user-notification.dto';
import { UserNotificationResource } from './resources/user-notification.resources';

@Injectable()
export class UserNotificationService {
  constructor(
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
    private redisService: RedisService,
  ) {}

  async create(createUserNotificationDto: CreateUserNotificationDto) {
    const userNotification = await this.userNotificationRepository.save(
      this.userNotificationRepository.create({
        ...createUserNotificationDto,
      }),
    );

    this.redisService.del(
      `${RedisKeyEnum.notification}:${createUserNotificationDto.user_id}`,
    );

    return await this.userNotificationRepository.findOne({
      id: userNotification.id,
    });
  }

  async createBulk(createUserNotificationDtos: CreateUserNotificationDto[]) {
    const saveData = [];
    createUserNotificationDtos.forEach((element) => {
      saveData.push(
        this.userNotificationRepository.create({
          ...element,
        }),
      );
    });

    const userNotifications = await this.userNotificationRepository.save(
      saveData,
    );

    createUserNotificationDtos.forEach((element) => {
      this.redisService.del(`${RedisKeyEnum.notification}:${element.user_id}`);
    });

    return userNotifications;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.notification}:${paginationOptions.user_id}`,
      typeof UserNotificationResource,
    );
    if (value != null) {
      return value;
    }

    const data = this.userNotificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', {
        userId: paginationOptions.user_id,
      })
      .andWhere('notification.source = :source', {
        source: paginationOptions.source,
      })
      .orderBy('id', 'DESC');

    const total = await this.userNotificationRepository.count();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const getData = await data.getMany();

    const returnedData = infinityPagination(
      getData,
      UserNotificationResource,
      paginationOptions,
    );

    this.redisService.set(
      `${RedisKeyEnum.notification}:${paginationOptions.user_id}`,
      returnedData,
    );

    return returnedData;
  }

  async read(id: number, userId: number) {
    const exists = await this.userNotificationRepository.findOne({
      id: id,
      user_id: userId,
    });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Notifikasi tidak ditemukan',
      );
    }

    await this.userNotificationRepository.update(id, {
      status: 1,
    });

    this.redisService.del(`${RedisKeyEnum.notification}:${userId}`);
  }
}
