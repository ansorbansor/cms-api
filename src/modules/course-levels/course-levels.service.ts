import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { CourseLevel } from 'src/entities/course-level.entity';
import { CreateCourseLevelDto } from './dto/create-course-level.dto';
import { CourseLevelResource } from './resources/course-level.resources';
import { UpdateCourseLevelDto } from './dto/update-course-level.dto';

@Injectable()
export class CourseLevelsService {
  constructor(
    @InjectRepository(CourseLevel)
    private courseLevelRepository: Repository<CourseLevel>,
    private redisService: RedisService,
  ) {}

  async create(createCourseCategoryDto: CreateCourseLevelDto) {
    const category = await this.courseLevelRepository.save(
      this.courseLevelRepository.create({
        ...createCourseCategoryDto,
      }),
    );

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.courseLevelRepository.count();
    paginationOptions.total = total;

    const result = await this.courseLevelRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    const levelId = result.map((e) => {
      return e.id;
    });

    const courseCount = await getManager().query(
      `SELECT COUNT(id) as total, level_id FROM courses ${
        levelId.length > 0 ? `WHERE level_id IN (${levelId})` : ''
      } GROUP BY level_id`,
    );

    return infinityPagination(
      result,
      CourseLevelResource,
      paginationOptions,
      courseCount,
    );
  }

  async findOne(fields: EntityCondition<CourseLevel>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.level}:${fields.id}`,
      typeof CourseLevelResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.courseLevelRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Level tidak ditemukan',
      );
    }

    const courseCount = await getManager().query(
      `SELECT COUNT(id) as total, level_id FROM courses WHERE level_id IN (${fields.id}) GROUP BY level_id`,
    );

    this.redisService.set(
      `${RedisKeyEnum.level}:${fields.id}`,
      CourseLevelResource(data, null, courseCount),
    );

    return CourseLevelResource(data, null, courseCount);
  }

  async update(updateCourseLevelDto: UpdateCourseLevelDto) {
    const exists = await this.findOne({ id: updateCourseLevelDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Level tidak ditemukan',
      );
    }

    await this.courseLevelRepository.update(updateCourseLevelDto.id, {
      ...updateCourseLevelDto,
    });

    this.redisService.del(`${RedisKeyEnum.level}:${updateCourseLevelDto.id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);

    return await this.findOne({ id: updateCourseLevelDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.level}:${id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);
    await this.courseLevelRepository.softDelete(id);
  }
}
