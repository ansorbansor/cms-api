import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import appConfig from './app.config';

@Injectable()
export class MailConfigService implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): MailerOptions {
    return appConfig().nodeEnv == 'development'
      ? this.configDev
      : this.configStageProd;
  }

  configDev = {
    transport: {
      host: this.configService.get('mail.host'),
      port: this.configService.get('mail.port'),
      ignoreTLS: this.configService.get('mail.ignoreTLS'),
      secure: this.configService.get('mail.secure'),
      requireTLS: this.configService.get('mail.requireTLS'),
      auth: {
        user: this.configService.get('mail.user'),
        pass: this.configService.get('mail.password'),
      },
    },
    defaults: {
      from: `"${this.configService.get(
        'mail.defaultName',
      )}" <${this.configService.get('mail.defaultEmail')}>`,
    },
    template: {
      dir: path.join(
        this.configService.get('app.workingDirectory'),
        'src',
        'interfaces',
        'mail',
      ),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  } as MailerOptions;

  configStageProd = {
    transport: `smtp://${this.configService.get(
      'mail.user',
    )}:${this.configService.get('mail.password')}@${this.configService.get(
      'mail.host',
    )}`,
    defaults: {
      from: `"${this.configService.get(
        'mail.defaultName',
      )}" <${this.configService.get('mail.defaultEmail')}>`,
    },
    template: {
      dir: path.join(
        this.configService.get('app.workingDirectory'),
        'src',
        'interfaces',
        'mail',
      ),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  } as MailerOptions;
}
