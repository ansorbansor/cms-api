import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
import {
  failedResponse,
  infinityPagination,
  successResponse,
} from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { CoursePriceType, RedisKeyEnum } from 'src/utils/enums';
import { FilesService } from '../files/files.service';
import { User } from 'src/entities/user.entity';
import { Course } from 'src/entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResource } from './resources/course.resources';
import { BufferedFile } from 'src/utils/file-helper';
import { UserLike } from 'src/entities/user-like.entity';
import { CourseAdminResource } from './resources/course-admin.resources';
import { CourseLanguageTransaction } from 'src/entities/course-language-transaction.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(UserLike)
    private userLikeRepository: Repository<UserLike>,
    @InjectRepository(CourseLanguageTransaction)
    private courseLanguageTransactionRepository: Repository<CourseLanguageTransaction>,

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

    if (createCourseDto.price_id == CoursePriceType.FREE) {
      createCourseDto.price = 0;
      createCourseDto.freemium_code = null;
    } else if (createCourseDto.price_id == CoursePriceType.PAID) {
      createCourseDto.freemium_code = null;
      if (!createCourseDto.price || createCourseDto.price == 0) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Harga tidak boleh kosong.',
        );
      }
    } else if (createCourseDto.price_id == CoursePriceType.FREEMIUM) {
      createCourseDto.price = 0;
      if (!createCourseDto.freemium_code) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Freemium Code tidak boleh kosong.',
        );
      }
    }

    const course = await this.courseRepository.save(
      this.courseRepository.create({
        ...createCourseDto,
      }),
    );

    createCourseDto.language_id.forEach(async (element) => {
      await this.courseLanguageTransactionRepository.save(
        this.courseLanguageTransactionRepository.create({
          course_id: course.id,
          language_id: element,
        }),
      );
    });

    return this.findOneAdmin({ id: course.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const redisKey = `${RedisKeyEnum.course}:-${RedisKeyEnum.user}${paginationOptions.user_id}-owned${paginationOptions.owned}-liked${paginationOptions.liked}-Page${paginationOptions.page}-Limit${paginationOptions.limit}-Search${paginationOptions.search}-${RedisKeyEnum.provider}${paginationOptions.provider}-${RedisKeyEnum.category}${paginationOptions.category}-${RedisKeyEnum.topic}${paginationOptions.topic}-${RedisKeyEnum.level}${paginationOptions.level}-${RedisKeyEnum.language}${paginationOptions.duration}-${RedisKeyEnum.language}${paginationOptions.language}-${RedisKeyEnum.price}${paginationOptions.price}-Schedule${paginationOptions.schedule}-Rating${paginationOptions.rating}`;

    const value = await this.redisService.get(redisKey, typeof CourseResource);
    if (value != null) {
      return value;
    }

    const data = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.provider', 'provider')
      .leftJoinAndSelect('course.courseCategory', 'category')
      .leftJoinAndSelect('course.topic', 'topic')
      .leftJoinAndSelect('course.courseLevel', 'courseLevel')
      .leftJoinAndSelect('course.courseLanguage', 'courseLanguage')
      .leftJoinAndSelect('course.coursePrice', 'coursePrice')
      .leftJoinAndSelect('course.photoFile', 'photoFile');

    if (paginationOptions.user_id) {
      data.leftJoinAndSelect('course.userCourse', 'userCourse');
      data.leftJoinAndSelect('course.userLike', 'userLike');
      if (paginationOptions.owned) {
        data.andWhere(`userCourse.user_id = ${paginationOptions.user_id}`);
      }
      if (paginationOptions.liked) {
        data.andWhere(`userLike.user_id = ${paginationOptions.user_id}`);
      }
    }

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
      const dur = await getManager().query(
        `SELECT MIN(minimum) as min, MAX(maximum) as max FROM course_durations WHERE id IN (${paginationOptions.duration})`,
      );

      if (dur[0] && dur[0].min && dur[0].max) {
        data.andWhere(`course.duration >= ${dur[0].min}`);
        data.andWhere(`course.duration <= ${dur[0].max}`);
      }
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

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);
    const getData = await data.getMany();

    const returnData = infinityPagination(
      getData,
      paginationOptions.is_admin ? CourseAdminResource : CourseResource,
      paginationOptions,
    );

    this.redisService.set(redisKey, returnData);

    return returnData;
  }

  async findOne(fields: EntityCondition<Course>, user?: User) {
    const redisKey = `${RedisKeyEnum.course}:${fields.id}-${RedisKeyEnum.user}${user?.id}`;
    const value = await this.redisService.get(redisKey, typeof CourseResource);
    if (value != null) {
      return value;
    }

    const data = await this.courseRepository.findOne({
      where: fields,
      relations: [
        'provider',
        'courseCategory',
        'topic',
        'courseLevel',
        'courseLanguage',
        'coursePrice',
        'photoFile',
        'courseLanguage.language',
      ],
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pelatihan tidak ditemukan',
      );
    }

    this.redisService.set(redisKey, CourseResource(data));

    return CourseResource(data);
  }

  async findOneAdmin(fields: EntityCondition<Course>) {
    const data = await this.courseRepository.findOne({
      where: fields,
      relations: [
        'provider',
        'courseCategory',
        'topic',
        'courseLevel',
        'courseLanguage',
        'coursePrice',
        'photoFile',
        'courseLanguage.language',
      ],
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pelatihan tidak ditemukan',
      );
    }

    return CourseAdminResource(data);
  }

  async update(
    updateCourseDto: UpdateCourseDto,
    photo: BufferedFile,
    user: User,
  ) {
    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, user.id);
      updateCourseDto.photo = img;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { language_id, ...saveData } = updateCourseDto;

    await this.courseRepository.update(updateCourseDto.id, {
      ...saveData,
    });

    if (updateCourseDto.language_id) {
      await this.courseLanguageTransactionRepository.softDelete({
        course_id: updateCourseDto.id,
      });

      updateCourseDto.language_id.forEach(async (element) => {
        await this.courseLanguageTransactionRepository.save(
          this.courseLanguageTransactionRepository.create({
            course_id: updateCourseDto.id,
            language_id: element,
          }),
        );
      });
    }

    this.redisService.del(`${RedisKeyEnum.course}:`);

    return await this.findOneAdmin({ id: updateCourseDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.course}`);
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
        const redisKey = `${RedisKeyEnum.course}:${courseId}-${RedisKeyEnum.user}${user.id}`;
        this.redisService.del(redisKey);
        return successResponse(null, 'Pelatihan tidak disukai');
      }
    } else {
      await this.userLikeRepository.save(
        this.userLikeRepository.create({
          user_id: user.id,
          course_id: courseId,
        }),
      );

      const redisKey = `${RedisKeyEnum.course}:${courseId}-${RedisKeyEnum.user}${user.id}`;
      this.redisService.del(redisKey);
      return successResponse(null, 'Pelatihan berhasil disukai');
    }
  }
}
