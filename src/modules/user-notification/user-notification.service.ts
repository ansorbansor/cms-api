import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { In, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { UserNotification } from 'src/entities/user-notification.entity';
import { CreateUserNotificationDto } from './dto/create-user-notification.dto';
import { UserNotificationResource } from './resources/user-notification.resources';
import { UpdateUserNotificationTokenDto } from './dto/update-user-notification-token.dto';
import { User } from 'src/entities/user.entity';
import * as firebase from 'firebase-admin';

@Injectable()
export class UserNotificationService {
  constructor(
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
  ) {}

  async postToken(
    userId: number,
    updateUserNotificationTokenDto: UpdateUserNotificationTokenDto,
  ) {
    await this.userRepository.update(userId, updateUserNotificationTokenDto);

    return 'success';
  }

  async create(createUserNotificationDto: CreateUserNotificationDto) {
    const userNotification = await this.userNotificationRepository.save(
      this.userNotificationRepository.create({
        ...createUserNotificationDto,
      }),
    );

    const user = await this.userRepository.findOne({
      id: userNotification.user_id,
    });

    this.redisService.del(
      `${RedisKeyEnum.notification}:${createUserNotificationDto.user_id}`,
    );

    if (user.notification_token) {
      const message = {
        token: user.notification_token,
        notification: {
          title: createUserNotificationDto.title,
          body: createUserNotificationDto.description,
        },
      };

      await this.sendNotification([message]);
    }

    return await this.userNotificationRepository.findOne({
      id: userNotification.id,
    });
  }

  async createBulk(createUserNotificationDtos: CreateUserNotificationDto[]) {
    const saveData = [];
    const messages = [];
    const userIds = [];

    //loop to get notification tokens
    createUserNotificationDtos.forEach((element) => {
      userIds.push(element.user_id);
    });

    const users = await this.userRepository.find({ id: In(userIds) });

    createUserNotificationDtos.forEach((element, index) => {
      saveData.push(
        this.userNotificationRepository.create({
          ...element,
        }),
      );

      if (users[index].notification_token) {
        messages.push({
          token: users[index].notification_token,
          notification: {
            title: element.title,
            body: element.description,
          },
        });
      }
    });

    if (messages.length > 0) {
      await this.sendNotification([messages]);
    }

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

  async sendNotification(messages: any[]) {
    return await firebase
      .messaging()
      .sendAll(messages)
      .then((response) => {
        // Response is a message ID string.
        return `Successfully sent message:${response}`;
      })
      .catch((error) => {
        return `Error sent message:${error}`;
      });
  }
}
