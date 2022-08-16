import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { FilesService } from '../files/files.service';
import { User } from 'src/entities/user.entity';
import { Course } from 'src/entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResource } from './resources/course.resources';
import { BufferedFile } from 'src/utils/file-helper';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,

    private redisService: RedisService,
    private fileService: FilesService,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    photo: BufferedFile,
    user: User,
  ) {
    const img = await this.fileService.uploadWithMinio(photo, user);

    const course = await this.courseRepository.save(
      this.courseRepository.create({
        ...createCourseDto,
        photo: img.id,
      }),
    );

    return this.findOne({ id: course.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.course}Search:${paginationOptions.search}`,
      typeof CourseResource,
    );
    if (value != null) {
      return infinityPagination(value, CourseResource, paginationOptions);
    }

    const total = await this.courseRepository.count();
    paginationOptions.total = total;

    const data = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.provider', 'provider')
      .leftJoinAndSelect('course.courseCategory', 'category')
      .leftJoinAndSelect('course.topic', 'topic')
      .leftJoinAndSelect('course.courseLevel', 'courseLevel')
      .leftJoinAndSelect('course.courseLanguage', 'courseLanguage')
      .leftJoinAndSelect('course.courseRating', 'courseRating')
      .leftJoinAndSelect('course.coursePrice', 'coursePrice')
      .leftJoinAndSelect('course.photoFile', 'photoFile');
    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    if (paginationOptions.search) {
      data.where(
        `LOWER(course.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
    }

    const getData = await data.getMany();

    this.redisService.set(
      `${RedisKeyEnum.course}Search:${paginationOptions.search}`,
      getData,
    );

    return infinityPagination(getData, CourseResource, paginationOptions);
  }

  async findOne(fields: EntityCondition<Course>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.course}:${fields.id}`,
      typeof CourseResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.courseRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pelatihan tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.course}:${fields.id}`, data);

    return CourseResource(data);
  }

  async update(
    updateCourseDto: UpdateCourseDto,
    photo: BufferedFile,
    user: User,
  ) {
    const exists = await this.findOne({ id: updateCourseDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pelatihan tidak ditemukan',
      );
    }

    const img = await this.fileService.uploadWithMinio(photo, user);

    await this.courseRepository.update(updateCourseDto.id, {
      ...UpdateCourseDto,
      photo: img.id,
    });

    this.redisService.del(`${RedisKeyEnum.course}:${updateCourseDto.id}`);

    return await this.findOne({ id: updateCourseDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.course}:${id}`);
    await this.courseRepository.softDelete(id);
  }
}
