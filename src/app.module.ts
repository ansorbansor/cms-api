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
import { AreaModule } from './modules/area/area.module';
import { AuthModule } from './modules/auth/auth.module';
import { BiddingAreaModule } from './modules/bidding-area/site.module';
import { CustomerModule } from './modules/customer/customer.module';
import { EmployeePositionModule } from './modules/employee-position/employee-position.module';
import { ExportModule } from './modules/exports/export.module';
import { FilesModule } from './modules/files/files.module';
import { ForgotPasswordModule } from './modules/forgot-password/forgot-password.module';
import { ImportModule } from './modules/imports/import.module';
import { MailModule } from './modules/mail/mail.module';
import { OperatorModule } from './modules/operator/operator.module';
import { PDModule } from './modules/pd/pd.module';
import { PendingTypeModule } from './modules/pending-type/pending-type.module';
import { ProjectModule } from './modules/projects/project.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { RegionModule } from './modules/region/region.module';
import { RemarkProjectModule } from './modules/remark-project/remark-project.module';
import { SiteModule } from './modules/site/site.module';
import { SPKModule } from './modules/spk/spk.module';
import { StatusAcceptanceModule } from './modules/status-acceptance/status-acceptance.module';
import { TransportationModule } from './modules/transportation/transportation.module';
import { UsersModule } from './modules/users/users.module';
import { CustomThrottlerGuard } from './utils/guards';
import { HttpExceptionFilter } from './utils/HttpExceptionFilter';
import { GraphModule } from './modules/graph/graph.module';
import { AbsenceModule } from './modules/absence/absence.module';

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
    EmployeePositionModule,
    ExportModule,
    ImportModule,
    PurchaseOrdersModule,
    AreaModule,
    RegionModule,
    OperatorModule,
    CustomerModule,
    SiteModule,
    BiddingAreaModule,
    RemarkProjectModule,
    PendingTypeModule,
    PDModule,
    StatusAcceptanceModule,
    ProjectModule,
    SPKModule,
    TransportationModule,
    GraphModule,
    AbsenceModule,
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
