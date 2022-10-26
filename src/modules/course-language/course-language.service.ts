import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
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
    const data = this.courseLanguageRepository.createQueryBuilder('language');

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const result = await data.getMany();

    const providerId = result.map((e) => {
      return e.id;
    });

    const courseCount = await getManager().query(
      `SELECT COUNT(c.id) as total, clt.language_id FROM courses c, course_language_transactions clt WHERE c.id = clt.course_id AND c.status = 1 AND c.deleted_at IS NULL${
        providerId.length > 0 ? ` AND clt.language_id IN (${providerId})` : ''
      } GROUP BY clt.language_id`,
    );

    return infinityPagination(
      result,
      CourseLanguageResource,
      paginationOptions,
      courseCount,
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

    const courseCount = await getManager().query(
      `SELECT COUNT(c.id) as total FROM courses c, course_language_transactions clt WHERE c.id = clt.course_id AND c.status = 1 AND c.deleted_at IS NULL
       AND clt.language_id = ${fields.id} GROUP BY clt.language_id`,
    );

    this.redisService.set(
      `${RedisKeyEnum.language}:${fields.id}`,
      CourseLanguageResource(data, null, courseCount),
    );

    return CourseLanguageResource(data, null, courseCount);
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
