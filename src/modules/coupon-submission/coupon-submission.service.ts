import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, Repository } from 'typeorm';
import {
  failedResponse,
  infinityPagination,
  successResponse,
} from 'src/utils/responses';
import { CouponSubmission } from 'src/entities/coupon-submission.entity';
import {
  CouponStatus,
  CouponSubmissionStatus,
  CourseUserStatus,
  NotificationSource,
  NotificationType,
} from 'src/utils/enums';
import { CouponSubmissionResource } from './resources/coupon-submission.resources';
import { Course } from 'src/entities/course.entity';
import { UserCourse } from 'src/entities/user-course.entity';
import { StartCourseResource } from './resources/start-course.resources';
import { CouponSubmissionDetailResource } from './resources/coupon-submission-detail.resources';
import { Coupon } from 'src/entities/coupon.entity';
import { MailService } from '../mail/mail.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { UserNotificationService } from '../user-notification/user-notification.service';
import { CouponSubmissionController } from './coupon-submission.controller';
import { CreateUserNotificationDto } from '../user-notification/dto/create-user-notification.dto';

@Injectable()
export class CouponSubmissionService {
  constructor(
    @InjectRepository(CouponSubmission)
    private couponSubmissionRepository: Repository<CouponSubmission>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService,
    private activityLogService: ActivityLogService,
    private userNotificationService: UserNotificationService,
  ) {}

  async create(user: User, courseId: number, ip: string) {
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
        user_id: user.id,
      },
    });

    if (course.price == 0) {
      if (!data) {
        await this.userCourseRepository.save(
          this.userCourseRepository.create({
            user_id: user.id,
            course_id: courseId,
            progress: 50,
          }),
        );
      }

      await this.activityLogService.create({
        user_id: user.id,
        description: `Mendaftar Course ${course.name}`,
        ip: ip,
      });

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

    const pendingCouponSubmission =
      await this.couponSubmissionRepository.findOne({
        where: {
          status: CouponSubmissionStatus.PENDING,
          user_id: user.id,
        },
      });

    if (pendingCouponSubmission) {
      return successResponse(
        StartCourseResource(course, CourseUserStatus.REJECTED_VOUCHER),
        `Anda memiliki pengajuan kupon yang sedang diproses. Mohon tunggu informasi selanjutnya.`,
      );
    } else {
      const couponSubmission = await this.couponSubmissionRepository.findOne({
        where: {
          course_id: courseId,
          user_id: user.id,
        },
      });

      if (couponSubmission) {
        if (couponSubmission.status == CouponSubmissionStatus.PENDING) {
          return successResponse(
            StartCourseResource(course, CourseUserStatus.PENDING_VOUCHER),
            `Pengajuan kupon sedang dalam proses`,
          );
        } else if (couponSubmission.status == CouponSubmissionStatus.REJECTED) {
          await this.couponSubmissionRepository.save(
            this.couponSubmissionRepository.create({
              user_id: user.id,
              course_id: courseId,
              status: CouponSubmissionStatus.PENDING,
            }),
          );

          await this.activityLogService.create({
            user_id: user.id,
            description: `Mendaftar Course ${course.name}`,
            ip: ip,
          });

          const userData = await this.userRepository.findOne({ id: user.id });

          const users = await this.getUserAdmin();
          const notifData = [];
          users.forEach((element) => {
            const notif = new CreateUserNotificationDto();
            notif.user_id = element.id;
            notif.title = 'Pengajuan Kupon';
            notif.description = `${userData.name} (${userData.nip}) mengajukan kupon`;
            notif.type = NotificationType.COURSE;
            notif.source = NotificationSource.CMS;
            notif.extra_data = String(courseId);
            notifData.push(notif);
          });

          await this.userNotificationService.createBulk(notifData);

          return successResponse(
            StartCourseResource(course, CourseUserStatus.PENDING_VOUCHER),
            `Pengajuan kupon sedang dalam proses`,
          );
        } else {
          return successResponse(
            StartCourseResource(course, CourseUserStatus.REDIRECT),
            `Anda akan otomatis diarahkan ke ${course.provider.name}`,
          );
        }
      } else {
        await this.couponSubmissionRepository.save(
          this.couponSubmissionRepository.create({
            user_id: user.id,
            course_id: courseId,
            status: CouponSubmissionStatus.PENDING,
          }),
        );

        await this.activityLogService.create({
          user_id: user.id,
          description: `Mendaftar Course ${course.name}`,
          ip: ip,
        });

        const userData = await this.userRepository.findOne({ id: user.id });
        const users = await this.getUserAdmin();
        const notifData = [];
        users.forEach((element) => {
          const notif = new CreateUserNotificationDto();
          notif.user_id = element.id;
          notif.title = 'Pengajuan Kupon';
          notif.description = `${userData.name} (${userData.nip}) mengajukan kupon`;
          notif.type = NotificationType.COURSE;
          notif.source = NotificationSource.CMS;
          notif.extra_data = String(courseId);
          notifData.push(notif);
        });

        await this.userNotificationService.createBulk(notifData);

        return successResponse(
          StartCourseResource(course, CourseUserStatus.PENDING_VOUCHER),
          `Pengajuan kupon sedang dalam proses`,
        );
      }
    }
  }

  async getUserAdmin() {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.roleData', 'roleData')
      .leftJoinAndSelect('roleData.roleAccess', 'roleAccess')
      .leftJoinAndSelect('roleAccess.menu', 'menu')
      .where('menu.be_controller = :BEController', {
        BEController: CouponSubmissionController.name,
      })
      .orWhere('roleData.grant_all_access = 1')
      .getMany();

    return users;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const subquery = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionTotal')
      .select('COUNT(couponSubmissionTotal.user_id)', 'total_submissions')
      .addSelect('couponSubmissionTotal.user_id', 'user_id')
      .groupBy('couponSubmissionTotal.user_id')
      .where(`YEAR(couponSubmissionTotal.created_at) = YEAR(CURRENT_DATE)`);

    const subqueryApprovedCoupon = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionApproved')
      .select(
        'COUNT(couponSubmissionApproved.user_id)',
        'total_submissions_approved',
      )
      .addSelect('couponSubmissionApproved.user_id', 'user_id')
      .groupBy('couponSubmissionApproved.user_id')
      .where(`YEAR(couponSubmissionApproved.created_at) = YEAR(CURRENT_DATE)`)
      .andWhere(
        `couponSubmissionApproved.status = ${CouponSubmissionStatus.APPROVED}`,
      );

    const data = this.couponSubmissionRepository
      .createQueryBuilder('couponSubmission')
      .select('couponSubmission.created_at', 'created_at')
      .addSelect('couponSubmission.id', 'id')
      .addSelect('couponSubmission.status', 'status')
      .addSelect('couponSubmission.reason', 'reason')
      .addSelect('user.nip', 'user_nip')
      .addSelect('user.name', 'user_name')
      .addSelect('course.price', 'course_price')
      .addSelect('employeePosition.id', 'user_position_id')
      .addSelect('employeePosition.name', 'user_position_name')
      .addSelect('employeeLevel.id', 'user_level_id')
      .addSelect('employeeLevel.name', 'user_level_name')
      .addSelect('employeeUnit.id', 'user_unit_id')
      .addSelect('employeeUnit.name', 'user_unit_name')
      .addSelect('user.level', 'user_level')
      .addSelect('user.blacklist', 'user_blacklist')
      .addSelect('roleData.id', 'role_id')
      .addSelect('roleData.name', 'role_name')
      .addSelect(
        '`couponSubmissionTotal`.total_submissions',
        'total_submissions',
      )
      .addSelect(
        '`couponSubmissionApproved`.total_submissions_approved',
        'total_submissions_approved',
      )
      .leftJoin('couponSubmission.user', 'user')
      .leftJoin('couponSubmission.course', 'course')
      .leftJoin('user.employeePosition', 'employeePosition')
      .leftJoin('user.employeeLevel', 'employeeLevel')
      .leftJoin('user.employeeUnit', 'employeeUnit')
      .leftJoin('user.userRoles', 'userRoles')
      .leftJoin('userRoles.roleData', 'roleData')
      .leftJoin(
        '(' + subquery.getQuery() + ')',
        'couponSubmissionTotal',
        '`couponSubmission`.user_id = `couponSubmissionTotal`.user_id',
      )
      .leftJoin(
        '(' + subqueryApprovedCoupon.getQuery() + ')',
        'couponSubmissionApproved',
        '`couponSubmission`.user_id = `couponSubmissionApproved`.user_id',
      );

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(
            `LOWER(user.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          ).orWhere(
            `user.nip LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          );
        }),
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

    if (
      paginationOptions.level != undefined &&
      paginationOptions.level.length > 0
    ) {
      data.andWhere(`user.level = ${paginationOptions.level}`);
    }

    if (
      paginationOptions.blacklist != undefined &&
      paginationOptions.blacklist != ''
    ) {
      data.andWhere(
        `user.blacklist = ${paginationOptions.blacklist == 'true' ? 1 : 0}`,
      );
    }

    if (
      paginationOptions.status_string != undefined &&
      paginationOptions.status_string != ''
    ) {
      data.andWhere(
        `couponSubmission.status = ${paginationOptions.status_string}`,
      );
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);
    data.orderBy('id', 'DESC');

    const rawData = await data.getRawMany();
    const getData = [];
    rawData.forEach((e) => {
      if (!getData.find((j) => j.id == e.id)) {
        getData.push(e);
      }
    });

    return infinityPagination(
      getData,
      CouponSubmissionResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CouponSubmission>) {
    const data = await this.couponSubmissionRepository
      .createQueryBuilder('couponSubmission')
      .leftJoinAndSelect('couponSubmission.user', 'user')
      .leftJoinAndSelect('couponSubmission.course', 'course')
      .leftJoinAndSelect('couponSubmission.coupon', 'coupon')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .leftJoinAndSelect('user.employeeLevel', 'employeeLevel')
      .leftJoinAndSelect('user.employeeUnit', 'employeeUnit')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .leftJoinAndSelect('userRole.roleData', 'role')
      .leftJoinAndSelect('coupon.provider', 'provider')
      .leftJoinAndSelect('coupon.course', 'couponCourse')
      .leftJoinAndSelect('user.userTopic', 'userTopic')
      .leftJoinAndSelect('userTopic.category', 'category')
      .leftJoinAndSelect('userTopic.topic', 'topic')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Permintaan tidak ditemukan',
      );
    }

    const couponSubmissionTotal = await this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionTotal')
      .select('COUNT(couponSubmissionTotal.user_id)', 'total_submissions')
      .addSelect('couponSubmissionTotal.user_id', 'user_id')
      .groupBy('couponSubmissionTotal.user_id')
      .where(`YEAR(couponSubmissionTotal.created_at) = YEAR(CURRENT_DATE)`)
      .andWhere(`couponSubmissionTotal.user_id = ${data.user_id}`)
      .getRawOne();

    const couponSubmissionApproved = await this.couponSubmissionRepository
      .createQueryBuilder('couponSubmissionApproved')
      .select(
        'COUNT(couponSubmissionApproved.user_id)',
        'total_submissions_approved',
      )
      .addSelect('couponSubmissionApproved.user_id', 'user_id')
      .groupBy('couponSubmissionApproved.user_id')
      .where(`YEAR(couponSubmissionApproved.created_at) = YEAR(CURRENT_DATE)`)
      .andWhere(
        `couponSubmissionApproved.status = ${CouponSubmissionStatus.APPROVED}`,
      )
      .andWhere(`couponSubmissionApproved.user_id = ${data.user_id}`)
      .getRawOne();

    return CouponSubmissionDetailResource(
      data,
      couponSubmissionTotal && couponSubmissionTotal.total_submissions
        ? couponSubmissionTotal.total_submissions
        : 0,
      couponSubmissionApproved &&
        couponSubmissionApproved.total_submissions_approved
        ? couponSubmissionApproved.total_submissions_approved
        : 0,
    );
  }

  async update(
    submissionId: number,
    status: number,
    couponId: number,
    reason: string,
    user: User,
    ip: string,
  ) {
    if (!Object.values(CouponSubmissionStatus).includes(status)) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Status tidak sesuai',
      );
    }

    if (status == CouponSubmissionStatus.PENDING) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pengajuan tidak bisa diubah menjadi pending',
      );
    }

    const exists = await this.couponSubmissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.course', 'course')
      .leftJoinAndSelect('submission.user', 'user')
      .where({
        id: submissionId,
      })
      .getOne();

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pengajuan tidak ditemukan',
      );
    }

    if (exists.status == CouponSubmissionStatus.APPROVED) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Permintaan yang telah disetujui tidab bisa diubah',
      );
    }

    if (exists.status == status) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Status tidak bisa sama dengan status sebelumnya',
      );
    }

    if (status == CouponSubmissionStatus.APPROVED) {
      if (!couponId) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Kupon tidak boleh kosong',
        );
      }

      const coupon = await this.couponRepository
        .createQueryBuilder('coupon')
        .where({
          id: couponId,
          status: CouponStatus.AVAILABLE,
        })
        .getOne();

      if (!coupon) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Kupon tidak ditemukan',
        );
      } else if (coupon.provider_id != exists.course.provider_id) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Kupon tidak berlaku untuk pelatihan dari penyelenggara ini',
        );
      } else if (coupon.course_id && coupon.course_id != exists.course.id) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Kupon tidak berlaku untuk pelatihan ini',
        );
      }

      await this.couponSubmissionRepository.update(submissionId, {
        coupon_id: coupon.id,
        status: status,
      });

      await this.userCourseRepository.save(
        this.userCourseRepository.create({
          user_id: exists.user_id,
          course_id: exists.course_id,
          progress: 50,
        }),
      );

      await this.mailService.approveSubmission({
        to: exists.user.email,
        data: {
          courseUrl: exists.course.url,
          courseTitle: exists.course.name,
          couponCode: coupon.code,
        },
      });

      await this.activityLogService.create({
        user_id: user.id,
        description: `Setujui Pengajuan Kupon ${exists.user.email}`,
        ip: ip,
      });

      const notif = new CreateUserNotificationDto();
      notif.user_id = exists.user_id;
      notif.title = 'Pengajuan Kupon Berhasil';
      notif.description = `Pengajuan kupon untuk pembelajaran ${exists.course.name} telah disetujui`;
      notif.type = NotificationType.COURSE;
      notif.source = NotificationSource.WEBSITE;
      notif.extra_data = String(exists.course_id);

      await this.userNotificationService.create(notif);

      return successResponse(null, `Pengajuan berhasil disetujui`);
    } else {
      await this.couponSubmissionRepository.update(submissionId, {
        status: status,
        reason: reason,
      });

      await this.mailService.rejectSubmission({
        to: exists.user.email,
        data: {
          courseUrl: exists.course.url,
          courseTitle: exists.course.name,
          reason: reason,
        },
      });

      await this.activityLogService.create({
        user_id: user.id,
        description: `Menolak Pengajuan Kupon ${exists.user.email}`,
        ip: ip,
      });

      const notif = new CreateUserNotificationDto();
      notif.user_id = exists.user_id;
      notif.title = 'Pengajuan Kupon Gagal';
      notif.description = `Pengajuan kupon untuk pembelajaran ${exists.course.name} ditolak. Alasan : ${reason}. Cek email anda untuk informasi lebih lanjut.`;
      notif.type = NotificationType.COURSE;
      notif.source = NotificationSource.WEBSITE;
      notif.extra_data = String(exists.course_id);

      await this.userNotificationService.create(notif);

      return successResponse(null, `Pengajuan telah ditolak`);
    }
  }

  async softDelete(id: number): Promise<void> {
    await this.couponSubmissionRepository.softDelete(id);
  }
}
