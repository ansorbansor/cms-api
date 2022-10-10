import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, getManager, In, Repository } from 'typeorm';
import {
  failedResponse,
  infinityPagination,
  successResponse,
} from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import {
  CouponSubmissionStatus,
  CoursePriceType,
  CourseScheduleType,
  Rating,
  RedisKeyEnum,
} from 'src/utils/enums';
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
import { UserCourse } from 'src/entities/user-course.entity';
import { BulkUpdateCourseDto } from './dto/bulk-update-course.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

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
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    photo: BufferedFile,
    user: User,
    ip: string,
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

    await this.activityLogService.create({
      user_id: user.id,
      description: `Tambah Course ${createCourseDto.name}`,
      ip: ip,
    });

    const redisKey = `${RedisKeyEnum.course}:`;
    this.redisService.del(redisKey);

    return this.findOneAdmin({ id: course.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const redisKey = `${RedisKeyEnum.course}:-isAdmin${paginationOptions.is_admin}-${RedisKeyEnum.user}${paginationOptions.user_id}-owned${paginationOptions.owned}-liked${paginationOptions.liked}-Page${paginationOptions.page}-Limit${paginationOptions.limit}-Search${paginationOptions.search}-${RedisKeyEnum.provider}${paginationOptions.provider}-${RedisKeyEnum.category}${paginationOptions.category}-${RedisKeyEnum.topic}${paginationOptions.topic}-${RedisKeyEnum.level}${paginationOptions.level}-${RedisKeyEnum.duration}${paginationOptions.duration}-${RedisKeyEnum.language}${paginationOptions.language}-${RedisKeyEnum.price}${paginationOptions.price}-Schedule${paginationOptions.schedule}-Rating${paginationOptions.rating}-Latest${paginationOptions.latest}-Popular${paginationOptions.popular}-Submission${paginationOptions.submission}-EditorChoice${paginationOptions.editor_choice}`;

    const value = await this.redisService.get(
      redisKey,
      paginationOptions.is_admin
        ? typeof CourseAdminResource
        : typeof CourseResource,
    );
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
      .leftJoinAndSelect('courseLanguage.language', 'language')
      .leftJoinAndSelect('course.coursePrice', 'coursePrice')
      .leftJoinAndSelect('course.photoFile', 'photoFile')
      .leftJoinAndSelect('course.userLike', 'userLike');

    if (paginationOptions.is_admin) {
      data.leftJoinAndSelect('course.temporaryCourse', 'temporaryCourse');

      if (
        paginationOptions.status_string != undefined &&
        paginationOptions.status_string != ''
      ) {
        data.andWhere('course.status = :status', {
          status: paginationOptions.status_string == 'true' ? 1 : 0,
        });
      }
    }

    if (
      paginationOptions.user_id &&
      (paginationOptions.owned || paginationOptions.is_admin)
    ) {
      data.leftJoinAndSelect('course.userCourse', 'userCourse');
      if (paginationOptions.owned) {
        data.andWhere(`userCourse.user_id = ${paginationOptions.user_id}`);
      }
    }

    if (paginationOptions.user_id && paginationOptions.liked) {
      data.andWhere(`userLike.user_id = ${paginationOptions.user_id}`);
    }

    if (paginationOptions.submission) {
      data.leftJoinAndSelect('course.couponSubmission', 'couponSubmission');
      data.andWhere('couponSubmission.user_id = :userId', {
        userId: paginationOptions.user_id,
      });

      data.andWhere('couponSubmission.status = :status', {
        status: CouponSubmissionStatus.PENDING,
      });
    }

    if (paginationOptions.editor_choice) {
      data.innerJoin('course.editorChoiceCourse', 'editorChoiceCourse');
    }

    if (paginationOptions.search) {
      data.andWhere(
        `LOWER(course.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );

      data.andWhere(
        new Brackets((qb) => {
          qb.where(
            `LOWER(course.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          ).orWhere(
            `LOWER(course.coach) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          );
        }),
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
      if (paginationOptions.schedule.includes(CourseScheduleType.MANDIRI)) {
        data.andWhere(`course.date_course IS NULL`);
      } else if (
        paginationOptions.schedule.includes(CourseScheduleType.TERJADWAL)
      ) {
        data.andWhere(`course.date_course IS NOT NULL`);
      }
    }

    if (paginationOptions.rating) {
      data.andWhere(`course.rating IN (${paginationOptions.rating})`);
    }

    if (paginationOptions.popular) {
      data
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(uc.id)', 'count')
            .from(UserCourse, 'uc')
            .where('uc.course_id = course.id');
        }, 'count')
        .addOrderBy('count', 'DESC')
        .loadRelationCountAndMap('course.userCourseCount', 'course.userCourse');

      if (!paginationOptions.owned) {
        data.leftJoinAndSelect('course.userCourse', 'userCourse');
      }
    } else {
      data.orderBy('course.created_at', 'DESC');
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
        'userLike',
      ],
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pelatihan tidak ditemukan',
      );
    }

    this.redisService.set(redisKey, CourseResource(data, user.id));

    return CourseResource(data, user.id);
  }

  async findOneAdmin(fields: EntityCondition<Course>, user?: User) {
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

    return CourseAdminResource(data, user?.id);
  }

  async update(
    updateCourseDto: UpdateCourseDto,
    photo: BufferedFile,
    user: User,
    ip: string,
  ) {
    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, user.id);
      updateCourseDto.photo = img;
    }

    if (updateCourseDto.price_id == CoursePriceType.FREE) {
      updateCourseDto.price = 0;
      updateCourseDto.freemium_code = null;
    } else if (updateCourseDto.price_id == CoursePriceType.PAID) {
      updateCourseDto.freemium_code = null;
      if (!updateCourseDto.price || updateCourseDto.price == 0) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Harga tidak boleh kosong.',
        );
      }
    } else if (updateCourseDto.price_id == CoursePriceType.FREEMIUM) {
      updateCourseDto.price = 0;
      if (!updateCourseDto.freemium_code) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Freemium Code tidak boleh kosong.',
        );
      }
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

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Course ${updateCourseDto.name}`,
      ip: ip,
    });

    this.redisService.del(`${RedisKeyEnum.course}:`);

    return await this.findOneAdmin({ id: updateCourseDto.id });
  }

  async bulkUpdate(updateCourseDto: BulkUpdateCourseDto) {
    if (updateCourseDto.price_id == CoursePriceType.FREE) {
      updateCourseDto.price = 0;
      updateCourseDto.freemium_code = null;
    } else if (updateCourseDto.price_id == CoursePriceType.PAID) {
      updateCourseDto.freemium_code = null;
      if (!updateCourseDto.price || updateCourseDto.price == 0) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Harga tidak boleh kosong.',
        );
      }
    } else if (updateCourseDto.price_id == CoursePriceType.FREEMIUM) {
      updateCourseDto.price = 0;
      if (!updateCourseDto.freemium_code) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Freemium Code tidak boleh kosong.',
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { language_id, course_id, ...saveData } = updateCourseDto;

    await this.courseRepository.update(updateCourseDto.course_id, {
      ...saveData,
    });

    if (updateCourseDto.language_id && updateCourseDto.language_id.length > 0) {
      await this.courseLanguageTransactionRepository.softDelete({
        course_id: In(updateCourseDto.course_id),
      });

      const saveLanguage = [];
      updateCourseDto.language_id.forEach(async (element) => {
        updateCourseDto.course_id.forEach(async (courseId) => {
          saveLanguage.push(
            this.courseLanguageTransactionRepository.create({
              course_id: courseId,
              language_id: element,
            }),
          );
        });
      });

      await this.courseLanguageTransactionRepository.save(saveLanguage);
    }

    this.redisService.del(`${RedisKeyEnum.course}:`);

    return 'success';
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.course}`);
    const deletedData = await this.courseRepository.findOne({ id: id });
    await this.courseRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Course ${deletedData.name}`,
      ip: ip,
    });
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
        const redisKey = `${RedisKeyEnum.course}:`;
        this.redisService.del(redisKey);
        return successResponse(null, 'Pelatihan berhasil disukai');
      } else {
        await this.userLikeRepository.softDelete(data.id);
        const redisKey = `${RedisKeyEnum.course}:`;
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

      const redisKey = `${RedisKeyEnum.course}:`;
      this.redisService.del(redisKey);
      return successResponse(null, 'Pelatihan berhasil disukai');
    }
  }

  async courseSchedule() {
    const data = await this.courseRepository
      .createQueryBuilder('course')
      .where('course.status = 1')
      .getMany();
    return [
      {
        id: CourseScheduleType.MANDIRI,
        name: 'Mandiri',
        course_count: data.filter((e) => e.date_course == null).length,
      },
      {
        id: CourseScheduleType.TERJADWAL,
        name: 'Terjadwal',
        course_count: data.filter((e) => e.date_course != null).length,
      },
    ];
  }

  async courseRating() {
    const data = await this.courseRepository
      .createQueryBuilder('course')
      .where('course.status = 1')
      .getMany();
    return [
      {
        id: Number(Rating.A),
        name: Rating.A,
        course_count: data.filter((e) => String(e.rating) == Rating.A).length,
      },
      {
        id: Number(Rating.B),
        name: Rating.B,
        course_count: data.filter((e) => String(e.rating) == Rating.B).length,
      },
      {
        id: Number(Rating.C),
        name: Rating.C,
        course_count: data.filter((e) => String(e.rating) == Rating.C).length,
      },
      {
        id: Number(Rating.D),
        name: Rating.D,
        course_count: data.filter((e) => String(e.rating) == Rating.D).length,
      },
      {
        id: Number(Rating.E),
        name: Rating.E,
        course_count: data.filter((e) => String(e.rating) == Rating.E).length,
      },
    ];
  }
}
