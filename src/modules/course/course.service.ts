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
  FilePath,
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
      const img = await this.fileService.uploadWithMinio(
        photo,
        user.id,
        FilePath.COURSE,
        'Course Thumbnail',
      );
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
    const redisKey = `${RedisKeyEnum.course}:-isAdmin${paginationOptions.is_admin}-${RedisKeyEnum.user}${paginationOptions.user_id}-owned${paginationOptions.owned}-liked${paginationOptions.liked}-Page${paginationOptions.page}-Limit${paginationOptions.limit}-Search${paginationOptions.search}-${RedisKeyEnum.provider}${paginationOptions.provider}-${RedisKeyEnum.category}${paginationOptions.category}-${RedisKeyEnum.topic}${paginationOptions.topic}-${RedisKeyEnum.level}${paginationOptions.level}-${RedisKeyEnum.duration}${paginationOptions.duration}-${RedisKeyEnum.language}${paginationOptions.language}-${RedisKeyEnum.price}${paginationOptions.price}-Schedule${paginationOptions.schedule}-Rating${paginationOptions.rating}-Latest${paginationOptions.latest}-Popular${paginationOptions.popular}-Submission${paginationOptions.submission}-EditorChoice${paginationOptions.editor_choice}-Status${paginationOptions.status_string}`;

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
      .createQueryBuilder('courses')
      .leftJoinAndSelect('courses.provider', 'provider')
      .leftJoinAndSelect('courses.courseCategory', 'category')
      .leftJoinAndSelect('courses.topic', 'topic')
      .leftJoinAndSelect('courses.courseLevel', 'courseLevel')
      .leftJoinAndSelect('courses.courseLanguage', 'courseLanguage')
      .leftJoinAndSelect('courseLanguage.language', 'language')
      .leftJoinAndSelect('courses.coursePrice', 'coursePrice')
      .leftJoinAndSelect('courses.photoFile', 'photoFile')
      .leftJoinAndSelect('courses.userLike', 'userLike')
      .leftJoinAndSelect('courses.userCourse', 'userCourse');

    if (paginationOptions.is_admin) {
      data.leftJoinAndSelect('courses.temporaryCourse', 'temporaryCourse');

      if (
        paginationOptions.status_string != undefined &&
        paginationOptions.status_string != ''
      ) {
        data.andWhere('courses.status = :status', {
          status: paginationOptions.status_string == 'true' ? 1 : 0,
        });
      }
    } else {
      data.andWhere('courses.status = :status', {
        status: 1,
      });
    }

    if (
      paginationOptions.user_id &&
      (paginationOptions.owned || paginationOptions.is_admin)
    ) {
      data.andWhere(`userCourse.user_id = ${paginationOptions.user_id}`);
    }

    if (paginationOptions.user_id && paginationOptions.liked) {
      data.andWhere(`userLike.user_id = ${paginationOptions.user_id}`);
    }

    if (paginationOptions.submission) {
      data.leftJoinAndSelect('courses.couponSubmission', 'couponSubmission');
      data.andWhere('couponSubmission.user_id = :userId', {
        userId: paginationOptions.user_id,
      });

      data.andWhere('couponSubmission.status = :submissionStatus', {
        submissionStatus: CouponSubmissionStatus.PENDING,
      });
    }

    if (paginationOptions.editor_choice) {
      data.innerJoin('courses.editorChoiceCourse', 'editorChoiceCourse');
    }

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(
            `LOWER(courses.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          ).orWhere(
            `LOWER(courses.coach) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          );
        }),
      );
    }

    if (
      paginationOptions.is_admin &&
      paginationOptions.provider &&
      paginationOptions.provider.find((e) => e == 'empty')
    ) {
      data.andWhere(`courses.provider_id IS NULL`);
    } else if (paginationOptions.provider) {
      data.andWhere(`provider.id IN (${paginationOptions.provider})`);
    }

    if (
      paginationOptions.is_admin &&
      paginationOptions.category &&
      paginationOptions.category.find((e) => e == 'empty')
    ) {
      data.andWhere(`courses.category_id IS NULL`);
    } else if (paginationOptions.category) {
      data.andWhere(`category.id IN (${paginationOptions.category})`);
    }

    if (
      paginationOptions.is_admin &&
      paginationOptions.topic &&
      paginationOptions.topic.find((e) => e == 'empty')
    ) {
      data.andWhere(`courses.topic_id IS NULL`);
    } else if (paginationOptions.topic) {
      data.andWhere(`topic.id IN (${paginationOptions.topic})`);
    }

    if (
      paginationOptions.is_admin &&
      paginationOptions.level &&
      paginationOptions.level.find((e) => e == 'empty')
    ) {
      data.andWhere(`courses.level_id IS NULL`);
    } else if (paginationOptions.level) {
      data.andWhere(`courseLevel.id IN (${paginationOptions.level})`);
    }

    if (
      paginationOptions.is_admin &&
      paginationOptions.duration &&
      paginationOptions.duration.find((e) => e == 'empty')
    ) {
      data.andWhere(`courses.duration IS NULL`);
    } else if (
      paginationOptions.duration != undefined &&
      paginationOptions.duration.length > 0
    ) {
      const dur = await getManager().query(
        `SELECT MIN(minimum) as min, MAX(maximum) as max FROM course_durations WHERE id IN (${paginationOptions.duration})`,
      );

      if (dur[0] && dur[0].min != null && dur[0].max != null) {
        data.andWhere(`courses.duration >= ${dur[0].min}`);
        data.andWhere(`courses.duration <= ${dur[0].max}`);
      }
    }

    if (
      paginationOptions.is_admin &&
      paginationOptions.language &&
      paginationOptions.language.find((e) => e == 'empty')
    ) {
      data.andWhere('courseLanguage.id IS NULL');
    } else if (paginationOptions.language) {
      const subquery = this.courseLanguageTransactionRepository
        .createQueryBuilder('lang')
        .select(`\`lang\`.\`course_id\``, 'langCourse_id')
        .where(`\`lang\`.\`language_id\` IN (${paginationOptions.language})`);

      data.innerJoinAndSelect(
        `(` + subquery.getQuery() + `)`,
        `jointable`,
        `\`courses\`.\`id\` = \`jointable\`.\`langCourse_id\``,
      );
    }

    if (
      paginationOptions.is_admin &&
      paginationOptions.price &&
      paginationOptions.price.find((e) => e == 'empty')
    ) {
      data.andWhere(`courses.price_id IS NULL`);
    } else if (paginationOptions.price) {
      data.andWhere(`coursePrice.id IN (${paginationOptions.price})`);
    }

    if (paginationOptions.schedule) {
      if (paginationOptions.schedule.includes(CourseScheduleType.MANDIRI)) {
        data.andWhere(`courses.date_course IS NULL`);
      } else if (
        paginationOptions.schedule.includes(CourseScheduleType.TERJADWAL)
      ) {
        data.andWhere(`courses.date_course IS NOT NULL`);
      }
    }

    if (paginationOptions.rating) {
      data.andWhere(`courses.rating IN (${paginationOptions.rating})`);
    }

    if (paginationOptions.popular) {
      data
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(uc.id)', 'count')
            .from(UserCourse, 'uc')
            .where('uc.course_id = courses.id');
        }, 'count')
        .addOrderBy('count', 'DESC')
        .loadRelationCountAndMap(
          'courses.userCourseCount',
          'courses.userCourse',
        );
    } else {
      data.orderBy('courses.created_at', 'DESC');
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
        'userCourse',
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
      const img = await this.fileService.uploadWithMinio(
        photo,
        user.id,
        FilePath.COURSE,
        'Course Thumbnail',
      );
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

    //multiple duration to adjust JP data
    saveData.duration = saveData.duration * 40;

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

    //multiple duration to adjust JP data
    if (saveData.duration) {
      saveData.duration = saveData.duration * 40;
    }

    if (updateCourseDto.status == 1) {
      const validateField = [];
      Object.values(updateCourseDto).forEach((x, index) => {
        if (x != null) {
          validateField.push(Object.keys(updateCourseDto)[index]);
        }
      });

      const checkData = await this.courseRepository
        .createQueryBuilder('courses')
        .leftJoinAndSelect('courses.provider', 'provider')
        .leftJoinAndSelect('courses.courseCategory', 'category')
        .leftJoinAndSelect('courses.topic', 'topic')
        .leftJoinAndSelect('courses.courseLevel', 'courseLevel')
        .leftJoinAndSelect('courses.courseLanguage', 'courseLanguage')
        .leftJoinAndSelect('courses.coursePrice', 'coursePrice')
        .where(`courses.id IN (${updateCourseDto.course_id})`)
        .getMany();

      const isNotValid = checkData.find(
        (e) => e.isDataComplete(validateField) != null,
      );

      if (isNotValid != null) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          isNotValid.isDataComplete(validateField),
        );
      }
    }

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

  async postLike(courseId: number, user: User, ip: string) {
    const data = await this.userLikeRepository.findOne({
      withDeleted: true,
      relations: ['course'],
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

        await this.activityLogService.create({
          user_id: user.id,
          description: `Menyukai Course ${data.course.name}`,
          ip: ip,
        });

        const redisKey = `${RedisKeyEnum.course}:`;
        this.redisService.del(redisKey);
        return successResponse(null, 'Pelatihan berhasil disukai');
      } else {
        await this.userLikeRepository.softDelete(data.id);

        await this.activityLogService.create({
          user_id: user.id,
          description: `Batal Menyukai Course ${data.course.name}`,
          ip: ip,
        });

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

      const data = await this.userLikeRepository.findOne({
        withDeleted: true,
        relations: ['course'],
        where: {
          user_id: user.id,
          course_id: courseId,
        },
      });

      await this.activityLogService.create({
        user_id: user.id,
        description: `Menyukai Course ${data.course.name}`,
        ip: ip,
      });

      const redisKey = `${RedisKeyEnum.course}:`;
      this.redisService.del(redisKey);
      return successResponse(null, 'Pelatihan berhasil disukai');
    }
  }

  async courseSchedule() {
    const data = await this.courseRepository
      .createQueryBuilder('courses')
      .where('courses.status = 1')
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
      .createQueryBuilder('courses')
      .where('courses.status = 1')
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
