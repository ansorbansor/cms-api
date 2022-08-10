import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { CoursePrice } from 'src/entities/course-price.entity';
import { CreateCoursePriceDto } from './dto/create-course-price.dto';
import { UpdateCoursePriceDto } from './dto/update-course-price.dto';
import { CoursePriceResource } from './resources/course-price.resources';

@Injectable()
export class CoursePriceService {
  constructor(
    @InjectRepository(CoursePrice)
    private coursePriceRepository: Repository<CoursePrice>,
    private redisService: RedisService,
  ) {}

  async create(createCourseCategoryDto: CreateCoursePriceDto) {
    const category = await this.coursePriceRepository.save(
      this.coursePriceRepository.create({
        ...createCourseCategoryDto,
      }),
    );

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.coursePriceRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.coursePriceRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      CoursePriceResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CoursePrice>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.category}${fields.id}`,
      typeof CoursePriceResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.coursePriceRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Harga tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.category}${fields.id}`, data);

    return CoursePriceResource(data);
  }

  async update(updateCoursePriceDto: UpdateCoursePriceDto) {
    const exists = await this.findOne({ id: updateCoursePriceDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Harga tidak ditemukan',
      );
    }

    await this.coursePriceRepository.update(updateCoursePriceDto.id, {
      ...updateCoursePriceDto,
    });

    this.redisService.del(`${RedisKeyEnum.category}${updateCoursePriceDto.id}`);

    return await this.findOne({ id: updateCoursePriceDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.category}${id}`);
    await this.coursePriceRepository.softDelete(id);
  }
}
