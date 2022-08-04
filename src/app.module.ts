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
import { RedisConfigService } from './config/redis-config.service';
import redisConfig from './config/redis.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { ForgotPasswordModule } from './modules/forgot-password/forgot-password.module';
import { MailModule } from './modules/mail/mail.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { UsersModule } from './modules/users/users.module';

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
