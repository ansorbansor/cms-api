import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import {
  failedResponse,
  infinityPagination,
  successResponse,
} from 'src/utils/responses';
import { CouponSubmission } from 'src/entities/coupon-submission.entity';
import { CouponSubmissionStatus, CourseUserStatus } from 'src/utils/enums';
import { CouponSubmissionResource } from './resources/coupon-submission.resources';
import { Course } from 'src/entities/course.entity';
import { UserCourse } from 'src/entities/user-course.entity';
import { StartCourseResource } from './resources/start-course.resources';

@Injectable()
export class CouponSubmissionService {
  constructor(
    @InjectRepository(CouponSubmission)
    private couponSubmissionRepository: Repository<CouponSubmission>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
  ) {}

  async create(userId: number, courseId: number) {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.provider', 'provider')
      .leftJoinAndSelect('course.courseCategory', 'category')
      .leftJoinAndSelect('course.topic', 'topic')
      .leftJoinAndSelect('course.courseLevel', 'courseLevel')
      .leftJoinAndSelect('course.courseLanguage', 'courseLanguage')
      .leftJoinAndSelect('course.coursePrice', 'coursePrice')
      .leftJoinAndSelect('course.photoFile', 'photoFile')
      .where({ id: courseId })
      .getOne();

    if (!course) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Course tidak ditemukan',
      );
    }

    const data = await this.userCourseRepository.findOne({
      where: {
        course_id: courseId,
        user_id: userId,
      },
    });

    if (course.price == 0) {
      if (!data) {
        await this.userCourseRepository.save(
          this.userCourseRepository.create({
            user_id: userId,
            course_id: courseId,
            progress: 50,
          }),
        );
      }

      return successResponse(
        StartCourseResource(course, CourseUserStatus.REDIRECT),
        `Anda akan otomatis diarahkan ke ${course.provider.name}`,
      );
    }

    if (data) {
      return successResponse(
        StartCourseResource(course, CourseUserStatus.REDIRECT),
        `Anda akan otomatis diarahkan ke ${course.provider.name}`,
      );
    }

    const couponSubmission = await this.couponSubmissionRepository.findOne({
      where: {
        course_id: courseId,
        user_id: userId,
      },
    });

    if (!couponSubmission) {
      await this.couponSubmissionRepository.save(
        this.couponSubmissionRepository.create({
          user_id: userId,
          course_id: courseId,
          status: CouponSubmissionStatus.PENDING,
        }),
      );

      return successResponse(null, `Pengajuan kupon sedang dalam proses`);
    } else {
      if (couponSubmission.status == CouponSubmissionStatus.PENDING) {
        return successResponse(
          StartCourseResource(null, CourseUserStatus.PENDING_VOUCHER),
          `Pengajuan kupon sedang dalam proses`,
        );
      } else if (couponSubmission.status == CouponSubmissionStatus.REJECTED) {
        return successResponse(
          StartCourseResource(null, CourseUserStatus.REJECTED_VOUCHER),
          `Pengajuan kupon anda ditolak!`,
        );
      } else {
        return successResponse(
          StartCourseResource(course, CourseUserStatus.REDIRECT),
          `Anda akan otomatis diarahkan ke ${course.provider.name}`,
        );
      }
    }
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const subquery = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionTotal')
      .select('COUNT(couponSubmissionTotal.user_id)', 'total_submissions')
      .addSelect('couponSubmissionTotal.user_id', 'user_id')
      .groupBy('couponSubmissionTotal.user_id')
      .where(
        `date_part('year', couponSubmissionTotal.created_at) = date_part('year', CURRENT_DATE)`,
      );

    const subqueryApprovedCoupon = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionApproved')
      .select(
        'COUNT(couponSubmissionApproved.user_id)',
        'total_submissions_approved',
      )
      .addSelect('couponSubmissionApproved.user_id', 'user_id')
      .groupBy('couponSubmissionApproved.user_id')
      .where(
        `date_part('year', couponSubmissionApproved.created_at) = date_part('year', CURRENT_DATE)`,
      )
      .andWhere(
        `couponSubmissionApproved.status = ${CouponSubmissionStatus.APPROVED}`,
      );

    const data = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmission')
      .select('couponSubmission.created_at', 'created_at')
      .addSelect('user.nip', 'user_nip')
      .addSelect('user.name', 'user_name')
      .addSelect('course.price', 'course_price')
      .addSelect('employeePosition.name', 'user_position')
      .addSelect('employeeLevel.name', 'user_level')
      .addSelect('user.blacklist', 'user_blacklist')
      .addSelect(
        '"couponSubmissionTotal".total_submissions',
        'total_submissions',
      )
      .addSelect(
        '"couponSubmissionApproved".total_submissions_approved',
        'total_submissions_approved',
      )
      .leftJoin('couponSubmission.user', 'user')
      .leftJoin('couponSubmission.course', 'course')
      .leftJoin('user.employeePosition', 'employeePosition')
      .leftJoin('user.employeeLevel', 'employeeLevel')
      .leftJoin(
        '(' + subquery.getQuery() + ')',
        'couponSubmissionTotal',
        '"couponSubmission".user_id = "couponSubmissionTotal".user_id',
      )
      .leftJoin(
        '(' + subqueryApprovedCoupon.getQuery() + ')',
        'couponSubmissionApproved',
        '"couponSubmission".user_id = "couponSubmissionApproved".user_id',
      );

    if (paginationOptions.search) {
      data.andWhere(
        `LOWER(user.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
    }

    if (paginationOptions.start_date && paginationOptions.end_date) {
      data.andWhere(
        `couponSubmission.created_at >= '${paginationOptions.start_date}'`,
      );
      data.andWhere(
        `couponSubmission.created_at <= '${paginationOptions.end_date}'`,
      );
    }

    if (paginationOptions.employeePosition) {
      data.andWhere(
        `employeePosition.id = ${paginationOptions.employeePosition}`,
      );
    }

    if (paginationOptions.employeeLevel) {
      data.andWhere(`employeeLevel.id = ${paginationOptions.employeeLevel}`);
    }

    if (paginationOptions.blacklist != null) {
      data.andWhere(`user.blacklist = ${paginationOptions.blacklist}`);
    }

    if (paginationOptions.status) {
      data.andWhere(`couponSubmission.status = ${paginationOptions.status}`);
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const getData = await data.getRawMany();

    return infinityPagination(
      getData,
      CouponSubmissionResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CouponSubmission>) {
    const subquery = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionTotal')
      .select('COUNT(couponSubmissionTotal.user_id)', 'total_submissions')
      .addSelect('couponSubmissionTotal.user_id', 'user_id')
      .groupBy('couponSubmissionTotal.user_id')
      .where(
        `date_part('year', couponSubmissionTotal.created_at) = date_part('year', CURRENT_DATE)`,
      );

    const subqueryApprovedCoupon = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionApproved')
      .select(
        'COUNT(couponSubmissionApproved.user_id)',
        'total_submissions_approved',
      )
      .addSelect('couponSubmissionApproved.user_id', 'user_id')
      .groupBy('couponSubmissionApproved.user_id')
      .where(
        `date_part('year', couponSubmissionApproved.created_at) = date_part('year', CURRENT_DATE)`,
      )
      .andWhere(
        `couponSubmissionApproved.status = ${CouponSubmissionStatus.APPROVED}`,
      );

    const data = await this.couponSubmissionRepository
      .createQueryBuilder('couponSubmission')
      .select('couponSubmission.created_at', 'created_at')
      .addSelect('user.nip', 'user_nip')
      .addSelect('user.name', 'user_name')
      .addSelect('course.price', 'course_price')
      .addSelect('employeePosition.name', 'user_position')
      .addSelect('employeeLevel.name', 'user_level')
      .addSelect('user.blacklist', 'user_blacklist')
      .addSelect(
        '"couponSubmissionTotal".total_submissions',
        'total_submissions',
      )
      .addSelect(
        '"couponSubmissionApproved".total_submissions_approved',
        'total_submissions_approved',
      )
      .leftJoin('couponSubmission.user', 'user')
      .leftJoin('couponSubmission.course', 'course')
      .leftJoin('user.employeePosition', 'employeePosition')
      .leftJoin('user.employeeLevel', 'employeeLevel')
      .leftJoin(
        '(' + subquery.getQuery() + ')',
        'couponSubmissionTotal',
        '"couponSubmission".user_id = "couponSubmissionTotal".user_id',
      )
      .leftJoin(
        '(' + subqueryApprovedCoupon.getQuery() + ')',
        'couponSubmissionApproved',
        '"couponSubmission".user_id = "couponSubmissionApproved".user_id',
      )
      .where(fields)
      .getRawOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Permintaan tidak ditemukan',
      );
    }

    return CouponSubmissionResource(data);
  }

  async softDelete(id: number): Promise<void> {
    await this.couponSubmissionRepository.softDelete(id);
  }
}
