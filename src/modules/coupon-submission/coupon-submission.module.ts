import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponSubmission } from 'src/entities/coupon-submission.entity';
import { Coupon } from 'src/entities/coupon.entity';
import { Course } from 'src/entities/course.entity';
import { UserCourse } from 'src/entities/user-course.entity';
import { User } from 'src/entities/user.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MailModule } from '../mail/mail.module';
import { UserNotificationModule } from '../user-notification/user-notification.module';
import { CouponSubmissionController } from './coupon-submission.controller';
import { CouponSubmissionService } from './coupon-submission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CouponSubmission,
      Course,
      UserCourse,
      Coupon,
      User,
    ]),
    MailModule,
    ActivityLogModule,
    UserNotificationModule,
  ],
  controllers: [CouponSubmissionController],
  providers: [CouponSubmissionService],
  exports: [CouponSubmissionService],
})
export class CouponSubmissionModule {}
