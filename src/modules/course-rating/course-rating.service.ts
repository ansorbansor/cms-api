import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { CourseRating } from 'src/entities/course-rating.entity';
import { CreateCourseRatingDto } from './dto/create-course-rating.dto';
import { CourseRatingResource } from './resources/course-rating.resources';
import { UpdateCourseRatingDto } from './dto/update-course-rating.dto';

@Injectable()
export class CourseRatingService {
  constructor(
    @InjectRepository(CourseRating)
    private courseRatingRepository: Repository<CourseRating>,
    private redisService: RedisService,
  ) {}

  async create(createCourseRatingDto: CreateCourseRatingDto) {
    const category = await this.courseRatingRepository.save(
      this.courseRatingRepository.create({
        ...createCourseRatingDto,
      }),
    );

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.courseRatingRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.courseRatingRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      CourseRatingResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CourseRating>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.rating}${fields.id}`,
      typeof CourseRatingResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.courseRatingRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.rating}${fields.id}`, data);

    return CourseRatingResource(data);
  }

  async update(updateCourseRatingDto: UpdateCourseRatingDto) {
    const exists = await this.findOne({ id: updateCourseRatingDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    await this.courseRatingRepository.update(updateCourseRatingDto.id, {
      ...updateCourseRatingDto,
    });

    this.redisService.del(`${RedisKeyEnum.rating}${updateCourseRatingDto.id}`);

    return await this.findOne({ id: updateCourseRatingDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.rating}${id}`);
    await this.courseRatingRepository.softDelete(id);
  }
}
