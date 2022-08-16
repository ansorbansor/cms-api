import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordService } from '../forgot-password/forgot-password.service';
import { MailService } from '../mail/mail.service';
import { User } from 'src/entities/user.entity';
import { AuthProvidersEnum, RedisKeyEnum, RoleEnum } from 'src/utils/enums';
import { FacebookInterface, SocialInterface } from 'src/utils/interfaces';
import { AuthEmailLoginDto } from './dtos/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dtos/auth-register-login.dto';
import { AuthUpdateDto } from './dtos/auth-update.dto';
import { failedResponse } from 'src/utils/responses';
import authConfig from 'src/config/auth.config';
import { UserResource } from '../users/resources/user.resources';
import { AuthGoogleLoginDto } from './dtos/auth-google-login.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { AuthFacebookLoginDto } from './dtos/auth-facebook-login.dto';
import { Facebook } from 'fb';
import { AuthAppleLoginDto } from './dtos/auth-apple-login.dto';
import appleSigninAuth from 'apple-signin-auth';
import { RedisService } from '../redis/redis.service';
import { BufferedFile } from 'src/utils/file-helper';
import { ActivityLogService } from '../activity-log/activity-log.service';
@Injectable()
export class AuthService {
  private google: OAuth2Client;
  private fb;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private forgotService: ForgotPasswordService,
    private mailService: MailService,
    private configService: ConfigService,
    private redisService: RedisService,
    private activityLogService: ActivityLogService,
  ) {
    this.google = new OAuth2Client(
      configService.get('google.clientId'),
      configService.get('google.clientSecret'),
    );
    this.fb = new Facebook({
      appId: configService.get('facebook.appId'),
      appSecret: configService.get('facebook.appSecret'),
      version: 'v7.0',
    });
  }

  async validateLogin(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
    ip: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOneFull({
      email: loginDto.email,
    });

    if (
      !user ||
      (user &&
        !user.userRole.some(
          (e) => e.role.id === (onlyAdmin ? RoleEnum.admin : RoleEnum.user),
        ))
    ) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'not found');
    }

    if (authConfig().emailVerification && user.hash != null) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'account not verified',
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (isValidPassword) {
      const token = await this.jwtService.sign({
        id: user.id,
        role: user.userRole.filter(function (e) {
          return e.role.id === (onlyAdmin ? RoleEnum.admin : RoleEnum.user);
        }),
      });

      await this.activityLogService.create({
        user_id: user.id,
        description: 'Melakukan Login',
        ip: ip,
      });

      return { token, user: user };
    } else {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'incorrectPassword',
      );
    }
  }

  async getProfileByTokenGoogle(
    loginDto: AuthGoogleLoginDto,
  ): Promise<SocialInterface> {
    const ticket = await this.google
      .verifyIdToken({
        idToken: loginDto.idToken,
        audience: [this.configService.get('google.clientId')],
      })
      .catch(() => {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Token tidak dikenal');
      });

    const data = ticket.getPayload();

    return {
      id: data.sub,
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
    };
  }

  async getProfileByTokenFacebook(
    loginDto: AuthFacebookLoginDto,
  ): Promise<SocialInterface> {
    this.fb.setAccessToken(loginDto.accessToken);

    const data: FacebookInterface = await new Promise((resolve) => {
      this.fb.api(
        '/me',
        'get',
        { fields: 'id,last_name,email,first_name' },
        (response) => {
          resolve(response);
        },
      );
    });

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
    };
  }

  async getProfileByTokenApple(
    loginDto: AuthAppleLoginDto,
  ): Promise<SocialInterface> {
    const data = await appleSigninAuth
      .verifyIdToken(loginDto.idToken, {
        audience: this.configService.get('apple.appAudience'),
      })
      .catch(() => {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Token tidak dikenal');
      });

    return {
      id: data.sub,
      email: data.email,
      firstName: loginDto.firstName,
      lastName: loginDto.lastName,
    };
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<{ token: string; user: User }> {
    const socialEmail = socialData.email?.toLowerCase();

    const user = await this.usersService.findOne({
      email: socialEmail,
    });

    if (user) {
      user.provider = authProvider;
      await this.usersService.update(user.id, user);
    } else {
      throw failedResponse(HttpStatus.NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    const jwtToken = await this.jwtService.sign({
      id: user.id,
      role: user.userRole,
    });

    return {
      token: jwtToken,
      user,
    };
  }

  async register(
    photo: BufferedFile,
    dto: AuthRegisterLoginDto,
  ): Promise<void> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const user = await this.usersService.create(photo, {
      ...dto,
      email: dto.email,
      role_id: RoleEnum.user,
      status: true,
      name: dto.name,
      provider: AuthProvidersEnum.email,
      notification_token: null,
      hash: hash,
    });

    await this.mailService.userSignUp({
      to: user.email,
      data: {
        hash,
      },
    });
  }

  async confirmEmail(hash: string): Promise<void> {
    const user = await this.usersService.findOneFull({
      hash,
    });

    if (!user) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'Not Found');
    }

    user.hash = null;
    user.status = true;
    await user.save();
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne({
      email,
    });

    if (!user) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'emailNotExists');
    } else {
      const hash = crypto
        .createHash('sha256')
        .update(randomStringGenerator())
        .digest('hex');
      await this.forgotService.create({
        hash,
        user,
      });

      await this.mailService.forgotPassword({
        to: email,
        data: {
          hash,
        },
      });
    }
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'notFound');
    }

    const user = forgot.user;
    user.password = password;
    await user.save();
    await this.forgotService.softDelete(forgot.id);
  }

  async me(user: User) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.user}:${user.id}`,
      typeof UserResource,
    );
    if (value != null) {
      return value;
    }

    const me = await this.usersService.findOne({ id: user.id });

    this.redisService.set(`${RedisKeyEnum.user}:${user.id}`, me);
    return me;
  }

  async update(
    user: User,
    userDto: AuthUpdateDto,
    photo?: BufferedFile,
  ): Promise<User> {
    if (userDto.password) {
      if (userDto.oldPassword) {
        const currentUser = await this.usersService.findOneFull({
          id: user.id,
        });

        const isValidOldPassword = await bcrypt.compare(
          userDto.oldPassword,
          currentUser.password,
        );

        if (!isValidOldPassword) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'incorrectOldPassword',
          );
        }
      } else {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'missingOldPassword',
        );
      }
    }

    await this.usersService.update(user.id, userDto, photo);

    this.redisService.del(`${RedisKeyEnum.user}:${user.id}`);

    return await this.usersService.findOne({
      id: user.id,
    });
  }

  async softDelete(user: User): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.user}:${user.id}`);
    await this.usersService.softDelete(user.id);
  }
}
