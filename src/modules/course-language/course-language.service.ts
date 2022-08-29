import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { CourseLanguage } from 'src/entities/course-language.entity';
import { CreateCourseLanguageDto } from './dto/create-course-language.dto';
import { CourseLanguageResource } from './resources/course-language.resources';
import { UpdateCourseLanguageDto } from './dto/update-course-language.dto';

@Injectable()
export class CourseLanguageService {
  constructor(
    @InjectRepository(CourseLanguage)
    private courseLanguageRepository: Repository<CourseLanguage>,
    private redisService: RedisService,
  ) {}

  async create(createCourseLanguageDto: CreateCourseLanguageDto) {
    const category = await this.courseLanguageRepository.save(
      this.courseLanguageRepository.create({
        ...createCourseLanguageDto,
      }),
    );

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.courseLanguageRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.courseLanguageRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        relations: ['course'],
      }),
      CourseLanguageResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CourseLanguage>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.language}:${fields.id}`,
      typeof CourseLanguageResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.courseLanguageRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Bahasa tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.language}:${fields.id}`, data);

    return CourseLanguageResource(data);
  }

  async update(updateCourseLanguageDto: UpdateCourseLanguageDto) {
    const exists = await this.findOne({ id: updateCourseLanguageDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Bahasa tidak ditemukan',
      );
    }

    await this.courseLanguageRepository.update(updateCourseLanguageDto.id, {
      ...updateCourseLanguageDto,
    });

    this.redisService.del(
      `${RedisKeyEnum.language}:${updateCourseLanguageDto.id}`,
    );
    this.redisService.del(`${RedisKeyEnum.course}`);

    return await this.findOne({ id: updateCourseLanguageDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.language}:${id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);
    await this.courseLanguageRepository.softDelete(id);
  }
}
