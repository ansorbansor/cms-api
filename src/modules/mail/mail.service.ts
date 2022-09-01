import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { MailData } from 'src/utils/interfaces';

@Injectable()
export class MailService {
  constructor(
    private i18n: I18nService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION)
      await this.mailerService.sendMail({
        to: mailData.to,
        subject: await this.i18n.t('language.confirmEmail'),
        text: `${this.configService.get('app.frontendDomain')}/confirm-email/${
          mailData.data.hash
        } ${await this.i18n.t('language.confirmEmail')}`,
        template: './activation',
        context: {
          title: await this.i18n.t('language.confirmEmail'),
          url: `${this.configService.get('app.frontendDomain')}/confirm-email/${
            mailData.data.hash
          }`,
          actionTitle: await this.i18n.t('language.confirmEmail'),
          app_name: this.configService.get('app.name'),
          activation_text1: await this.i18n.t('language.activation_text1'),
          activation_text2: await this.i18n.t('language.activation_text2'),
          activation_text3: await this.i18n.t('language.activation_text3'),
        },
      });
  }

  async forgotPassword(mailData: MailData<{ hash: string }>) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION)
      await this.mailerService.sendMail({
        to: mailData.to,
        subject: await this.i18n.t('language.resetPassword'),
        text: `${this.configService.get(
          'app.frontendDomain',
        )}/password-change/${mailData.data.hash} ${await this.i18n.t(
          'language.resetPassword',
        )}`,
        template: './reset-password',
        context: {
          title: await this.i18n.t('language.resetPassword'),
          url: `${this.configService.get(
            'app.frontendDomain',
          )}/password-change/${mailData.data.hash}`,
          actionTitle: await this.i18n.t('language.resetPassword'),
          app_name: this.configService.get('app.name'),
          baseUrl: `${this.configService.get(
            'minio.fullUrl',
          )}${this.configService.get('minio.bucketName')}/systems/`,
          frontendUrl: this.configService.get('app.frontendDomain'),
          hash: mailData.data.hash,
        },
      });
  }
}
