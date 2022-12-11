import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule, HeaderResolver, I18nJsonParser } from 'nestjs-i18n';
import * as path from 'path';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import fileConfig from './config/file.config';
import { MailConfigService } from './config/mail-config.service';
import mailConfig from './config/mail.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeePositionModule } from './modules/employee-position/employee-position.module';
import { ExportModule } from './modules/exports/export.module';
import { FilesModule } from './modules/files/files.module';
import { ForgotPasswordModule } from './modules/forgot-password/forgot-password.module';
import { ImportModule } from './modules/imports/import.module';
import { MailModule } from './modules/mail/mail.module';
import { RoleModule } from './modules/role/role.module';
import { UsersModule } from './modules/users/users.module';
import { CustomThrottlerGuard } from './utils/guards';
import { HttpExceptionFilter } from './utils/HttpExceptionFilter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, fileConfig, mailConfig],
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot({}),
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
    ActivityLogModule,
    RoleModule,
    EmployeePositionModule,
    ExportModule,
    ImportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
