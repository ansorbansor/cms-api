import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import minioConfig from 'src/config/minio.config';
import { MailSubject, SocialMediaUrl } from 'src/utils/enums';
import { MailData } from 'src/utils/interfaces';

@Injectable()
export class MailService {
  constructor(
    private i18n: I18nService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION == 'true')
      await this.mailerService
        .sendMail({
          to: mailData.to,
          subject: await this.i18n.t('language.confirmEmail'),
          text: `${this.configService.get(
            'app.frontendDomain',
          )}/confirm-email/${mailData.data.hash} ${await this.i18n.t(
            'language.confirmEmail',
          )}`,
          template: './activation',
          context: {
            title: await this.i18n.t('language.confirmEmail'),
            url: `${this.configService.get(
              'app.frontendDomain',
            )}/confirm-email/${mailData.data.hash}`,
            actionTitle: await this.i18n.t('language.confirmEmail'),
            app_name: this.configService.get('app.name'),
            activation_text1: await this.i18n.t('language.activation_text1'),
            activation_text2: await this.i18n.t('language.activation_text2'),
            activation_text3: await this.i18n.t('language.activation_text3'),
          },
        })
        .catch((err) => {
          console.log(err);
        });
  }

  async forgotPassword(mailData: MailData<{ hash: string; isAdmin: boolean }>) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION == 'true')
      await this.mailerService
        .sendMail({
          to: mailData.to,
          subject: MailSubject.FORGOT_PASSWORD,
          template: './reset-password',
          context: {
            url: `${this.configService.get(
              'app.frontendDomain',
            )}/password-change/${mailData.data.hash}`,
            baseUrl: `${minioConfig().fullUrl}systems/`,
            frontendUrl: mailData.data.isAdmin
              ? `${this.configService.get('app.cmsDomain')}/auth`
              : this.configService.get('app.frontendDomain'),
            hash: mailData.data.hash,
            facebookUrl: SocialMediaUrl.FACEBOOK,
            twitterUrl: SocialMediaUrl.TWITTER,
            instagramUrl: SocialMediaUrl.INSTAGRAM,
            whatsappUrl: SocialMediaUrl.WHATSAPP,
          },
        })
        .catch((err) => {
          console.log(err);
        });
  }

  async approveSubmission(
    mailData: MailData<{
      courseUrl: string;
      courseTitle: string;
      couponCode: string;
    }>,
  ) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION == 'true')
      await this.mailerService
        .sendMail({
          to: mailData.to,
          subject: MailSubject.APPROVED_COUPON_SUBMISSION,
          template: './approve-coupon-submission',
          context: {
            baseUrl: `${minioConfig().fullUrl}systems/`,
            frontendUrl: this.configService.get('app.frontendDomain'),
            courseUrl: mailData.data.courseUrl,
            courseTitle: mailData.data.courseTitle,
            couponCode: mailData.data.couponCode,
            facebookUrl: SocialMediaUrl.FACEBOOK,
            twitterUrl: SocialMediaUrl.TWITTER,
            instagramUrl: SocialMediaUrl.INSTAGRAM,
            whatsappUrl: SocialMediaUrl.WHATSAPP,
          },
        })
        .catch((err) => {
          console.log(err);
        });
  }

  async rejectSubmission(
    mailData: MailData<{
      courseUrl: string;
      courseTitle: string;
      reason: string;
    }>,
  ) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION == 'true')
      await this.mailerService
        .sendMail({
          to: mailData.to,
          subject: MailSubject.REJECTED_COUPON_SUBMISSION,
          template: './reject-coupon-submission',
          context: {
            baseUrl: `${minioConfig().fullUrl}systems/`,
            frontendUrl: this.configService.get('app.frontendDomain'),
            courseUrl: mailData.data.courseUrl,
            courseTitle: mailData.data.courseTitle,
            reason: mailData.data.reason,
            facebookUrl: SocialMediaUrl.FACEBOOK,
            twitterUrl: SocialMediaUrl.TWITTER,
            instagramUrl: SocialMediaUrl.INSTAGRAM,
            whatsappUrl: SocialMediaUrl.WHATSAPP,
          },
        })
        .catch((err) => {
          console.log(err);
        });
  }

  async welcome(
    mailData: MailData<{
      email: string;
      password: string;
    }>,
  ) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION == 'true')
      await this.mailerService
        .sendMail({
          to: mailData.to,
          subject: MailSubject.WELCOME,
          template: './welcome',
          context: {
            baseUrl: `${minioConfig().fullUrl}systems/`,
            frontendUrl: this.configService.get('app.frontendDomain'),
            email: mailData.data.email,
            password: mailData.data.password,
            facebookUrl: SocialMediaUrl.FACEBOOK,
            twitterUrl: SocialMediaUrl.TWITTER,
            instagramUrl: SocialMediaUrl.INSTAGRAM,
            whatsappUrl: SocialMediaUrl.WHATSAPP,
          },
        })
        .catch((err) => {
          console.log(err);
        })
        .catch((err) => {
          console.log(err);
        });
  }

  async registerProvider(
    mailData: MailData<{
      providerUrl: string;
      providerName: string;
      tutorialUrl: string;
    }>,
  ) {
    if (process.env.MAIL_HOST && process.env.EMAIL_VERIFICATION == 'true')
      await this.mailerService
        .sendMail({
          to: mailData.to,
          subject: MailSubject.REGISTER_PROVIDER,
          template: './register-provider',
          context: {
            baseUrl: `${minioConfig().fullUrl}systems/`,
            frontendUrl: this.configService.get('app.frontendDomain'),
            providerUrl: mailData.data.providerUrl,
            providerName: mailData.data.providerName,
            tutorialUrl: mailData.data.tutorialUrl,
            facebookUrl: SocialMediaUrl.FACEBOOK,
            twitterUrl: SocialMediaUrl.TWITTER,
            instagramUrl: SocialMediaUrl.INSTAGRAM,
            whatsappUrl: SocialMediaUrl.WHATSAPP,
          },
        })
        .catch((err) => {
          console.log(err);
        });
  }
}
