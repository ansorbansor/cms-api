import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { Topic } from 'src/entities/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { TopicResource } from './resources/topic.resources';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    private redisService: RedisService,
  ) {}

  async create(createTopicDto: CreateTopicDto) {
    const topic = await this.topicRepository.save(
      this.topicRepository.create({
        ...createTopicDto,
      }),
    );

    return this.findOne({ id: topic.id });
  }

  async createBulk(createTopicDto: CreateTopicDto[]) {
    await this.topicRepository.save(
      this.topicRepository.create(createTopicDto),
    );
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.topicRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.topicRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      TopicResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Topic>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.topic}:${fields.id}`,
      typeof TopicResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.topicRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Topic tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.topic}:${fields.id}`, data);

    return TopicResource(data);
  }

  async update(updateProfileDto: UpdateTopicDto) {
    const exists = await this.findOne({ id: updateProfileDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Topic tidak ditemukan',
      );
    }

    await this.topicRepository.update(updateProfileDto.id, {
      ...updateProfileDto,
    });

    this.redisService.del(`${RedisKeyEnum.topic}:${updateProfileDto.id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);
    this.redisService.del(`${RedisKeyEnum.category}`);

    return await this.findOne({ id: updateProfileDto.id });
  }

  async softDelete(id: number): Promise<void> {
    await this.topicRepository.softDelete(id);
    this.redisService.del(`${RedisKeyEnum.topic}:${id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);
    this.redisService.del(`${RedisKeyEnum.category}`);
  }

  async softDeleteByCategory(id: number): Promise<void> {
    await this.topicRepository.softDelete({
      category_id: id,
    });
    this.redisService.del(`${RedisKeyEnum.topic}:${id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);
    this.redisService.del(`${RedisKeyEnum.category}`);
  }
}
