import { MailerModule } from '@nestjs-modules/mailer';
import { CacheModule, CACHE_MANAGER, Inject, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule, HeaderResolver, I18nJsonParser } from 'nestjs-i18n';
import * as path from 'path';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import fileConfig from './config/file.config';
import googleConfig from './config/google.config';
import { MailConfigService } from './config/mail-config.service';
import mailConfig from './config/mail.config';
import minioConfig from './config/minio.config';
import { RedisConfigService } from './config/redis-config.service';
import redisConfig from './config/redis.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { BannerModule } from './modules/banner/banner.module';
import { CouponSubmissionModule } from './modules/coupon-submission/coupon-submission.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { CategoriesModule } from './modules/course-categories/course-categories.module';
import { CourseLanguageModule } from './modules/course-language/course-language.module';
import { CourseLevelsModule } from './modules/course-levels/course-levels.module';
import { CoursePriceModule } from './modules/course-price/course-price.module';
import { CourseModule } from './modules/course/course.module';
import { CourseDurationModule } from './modules/course_duration/course-duration.module';
import { EditorChoiceCourseModule } from './modules/editor-choice-course/editor-choice-course.module';
import { EmployeeLevelModule } from './modules/employee-level/employee-level.module';
import { EmployeePositionModule } from './modules/employee-position/employee-position.module';
import { EmployeeUnitModule } from './modules/employee-unit/employee-unit.module';
import { ExportModule } from './modules/exports/export.module';
import { FilesModule } from './modules/files/files.module';
import { ForgotPasswordModule } from './modules/forgot-password/forgot-password.module';
import { ImportModule } from './modules/imports/import.module';
import { MailModule } from './modules/mail/mail.module';
import { MenuModule } from './modules/menu/menu.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { RoleModule } from './modules/role/role.module';
import { TopicsModule } from './modules/topics/topics.module';
import { UsersModule } from './modules/users/users.module';
import { UserBlacklistsModule } from './modules/user_blacklists/user-blacklists.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        fileConfig,
        googleConfig,
        mailConfig,
        redisConfig,
        minioConfig,
      ],
      envFilePath: ['.env'],
    }),
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    MailerModule.forRootAsync({
      useClass: MailConfigService,
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('app.fallbackLanguage'),
        parserOptions: {
          path: path.join(
            configService.get('app.workingDirectory'),
            'src',
            'i18n',
            'translations',
          ),
        },
      }),
      parser: I18nJsonParser,
      inject: [ConfigService],
      resolvers: [new HeaderResolver(['x-custom-lang'])],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    ForgotPasswordModule,
    MailModule,
    UsersModule,
    ProvidersModule,
    CategoriesModule,
    TopicsModule,
    CourseLevelsModule,
    CourseLanguageModule,
    CoursePriceModule,
    CourseModule,
    ActivityLogModule,
    BannerModule,
    MenuModule,
    RoleModule,
    EditorChoiceCourseModule,
    UserBlacklistsModule,
    CouponModule,
    CourseDurationModule,
    CouponSubmissionModule,
    EmployeeLevelModule,
    EmployeePositionModule,
    EmployeeUnitModule,
    ExportModule,
    ImportModule,
  ],
})
export class AppModule {
  constructor(@Inject(CACHE_MANAGER) cacheManager) {
    const client = cacheManager.store.getClient();
    client.on('error', (error) => {
      console.error(error);
      return null;
    });
  }
}
