import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import {
  failedResponse,
  infinityPagination,
  successResponse,
} from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { FilesService } from '../files/files.service';
import { User } from 'src/entities/user.entity';
import { Course } from 'src/entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResource } from './resources/course.resources';
import { BufferedFile } from 'src/utils/file-helper';
import { UserLike } from 'src/entities/user-like.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(UserLike)
    private userLikeRepository: Repository<UserLike>,

    private redisService: RedisService,
    private fileService: FilesService,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    photo: BufferedFile,
    user: User,
  ) {
    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, user.id);
      createCourseDto.photo = img;
    }

    const course = await this.courseRepository.save(
      this.courseRepository.create({
        ...createCourseDto,
      }),
    );

    return this.findOne({ id: course.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.course}Search:${paginationOptions.search}-Page${paginationOptions.page}-Limit${paginationOptions.limit}`,
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
      .leftJoinAndSelect('course.coursePrice', 'coursePrice')
      .leftJoinAndSelect('course.photoFile', 'photoFile');
    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    if (paginationOptions.search) {
      data.andWhere(
        `LOWER(course.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
    }

    if (paginationOptions.provider) {
      data.andWhere(`provider.id IN (${paginationOptions.provider})`);
    }

    if (paginationOptions.category) {
      data.andWhere(`category.id IN (${paginationOptions.category})`);
    }

    if (paginationOptions.topic) {
      data.andWhere(`topic.id IN (${paginationOptions.topic})`);
    }

    if (paginationOptions.level) {
      data.andWhere(`courseLevel.id IN (${paginationOptions.level})`);
    }

    if (paginationOptions.duration) {
      data.andWhere(`course.lesson_hours IN (${paginationOptions.duration})`);
    }

    if (paginationOptions.language) {
      data.andWhere(`courseLanguage.id IN (${paginationOptions.language})`);
    }

    if (paginationOptions.price) {
      data.andWhere(`coursePrice.id IN (${paginationOptions.price})`);
    }

    if (paginationOptions.schedule) {
      if (paginationOptions.schedule.includes(0)) {
        data.andWhere(`course.date_course IS NULL`);
      } else if (paginationOptions.schedule.includes(1)) {
        data.andWhere(`course.date_course IS NOT NULL`);
      }
    }

    if (paginationOptions.rating) {
      data.andWhere(`course.rating IN (${paginationOptions.rating})`);
    }

    const getData = await data.getMany();

    this.redisService.set(
      `${RedisKeyEnum.course}Search:${paginationOptions.search}-Page${paginationOptions.page}-Limit${paginationOptions.limit}`,
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
    await this.findOne({ id: updateCourseDto.id });

    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, user.id);
      updateCourseDto.photo = img;
    }

    await this.courseRepository.update(updateCourseDto.id, {
      ...updateCourseDto,
    });

    this.redisService.del(`${RedisKeyEnum.course}:${updateCourseDto.id}`);

    return await this.findOne({ id: updateCourseDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.course}:${id}`);
    await this.courseRepository.softDelete(id);
  }

  async postLike(courseId: number, user: User) {
    const data = await this.userLikeRepository.findOne({
      withDeleted: true,
      where: {
        user_id: user.id,
        course_id: courseId,
      },
    });

    if (data) {
      if (data.deleted_at) {
        await this.userLikeRepository.update(data.id, {
          deleted_at: null,
        });
        return successResponse(null, 'Pelatihan berhasil disukai');
      } else {
        await this.userLikeRepository.softDelete(data.id);
        return successResponse(null, 'Pelatihan tidak disukai');
      }
    } else {
      await this.userLikeRepository.save(
        this.userLikeRepository.create({
          user_id: user.id,
          course_id: courseId,
        }),
      );
      return successResponse(null, 'Pelatihan berhasil disukai');
    }
  }
}
