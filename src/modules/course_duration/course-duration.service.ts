import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { CourseDuration } from 'src/entities/course-duration.entity';
import { CreateCourseDurationDto } from './dto/create-course-duration.dto';
import { CoursDurationResource } from './resources/course-duration.resources';
import { UpdateCourseDurationDto } from './dto/update-course-duration.dto';
import { Course } from 'src/entities/course.entity';

@Injectable()
export class CourseDurationService {
  constructor(
    @InjectRepository(CourseDuration)
    private courseDurationRepository: Repository<CourseDuration>,
  ) {}

  async create(createCourseDurationDto: CreateCourseDurationDto) {
    const category = await this.courseDurationRepository.save(
      this.courseDurationRepository.create({
        name: createCourseDurationDto.name,
        minimum: createCourseDurationDto.minimum,
        maximum: createCourseDurationDto.maximum,
      }),
    );

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.courseDurationRepository
      .createQueryBuilder('duration')
      .select('duration.id', 'id')
      .addSelect('duration.name', 'name')
      .addSelect('duration.minimum', 'minimum')
      .addSelect('duration.maximum', 'maximum')
      .addSelect('count(course.id)', 'course_count')
      .leftJoin(
        Course,
        'course',
        'course.duration >= duration.minimum AND course.duration <= duration.maximum AND course.status = 1',
      )
      .groupBy('duration.id');

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const getData = await data.getRawMany();

    return infinityPagination(
      getData,
      CoursDurationResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CourseDuration>) {
    const data = await this.courseDurationRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Durasi tidak ditemukan',
      );
    }

    return CoursDurationResource(data);
  }

  async update(updateCourseDurationDto: UpdateCourseDurationDto) {
    const exists = await this.findOne({ id: updateCourseDurationDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Durasi tidak ditemukan',
      );
    }

    await this.courseDurationRepository.update(updateCourseDurationDto.id, {
      name: updateCourseDurationDto.name,
      minimum: updateCourseDurationDto.minimum,
      maximum: updateCourseDurationDto.maximum,
    });

    return await this.findOne({ id: updateCourseDurationDto.id });
  }

  async softDelete(id: number): Promise<void> {
    await this.courseDurationRepository.softDelete(id);
  }
}
