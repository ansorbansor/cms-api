import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordService } from '../forgot-password/forgot-password.service';
import { MailService } from '../mail/mail.service';
import { User } from 'src/entities/user.entity';
import {
  AuthProvidersEnum,
  ErrorMessage,
  RedisKeyEnum,
  RoleEnum,
} from 'src/utils/enums';
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
import { ResetPasswordDataResource } from './resources/reset-password-data.resources';
import { ResetPasswordResource } from './resources/reset-password.resources';
import appConfig from 'src/config/app.config';
import { AuthUpdatePasswordDto } from './dtos/auth-update-password.dto';
import { Menu } from 'src/entities/menu.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveDirectoryUtils } from 'src/utils/active-directory-utils';
import { isNumber } from 'class-validator';
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
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
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
  ): Promise<{ token: string; user: User; menus: Menu[] }> {
    const user = await this.usersService.findOneFull({
      email: loginDto.email,
    });

    if (!user) {
      //check Active Directory user
      // const ADResult = await new ActiveDirectoryUtils().authAD(
      //   loginDto.email,
      //   loginDto.password,
      // );

      // if (!ADResult || !ADResult.code || ADResult.code != 0) {
      //   throw failedResponse(
      //     HttpStatus.UNPROCESSABLE_ENTITY,
      //     `${ErrorMessage.EMAIL_NOT_EXISTS} (${ADResult.code} : ${ADResult.description})`,
      //   );
      // } else {
      //   throw failedResponse(
      //     HttpStatus.UNPROCESSABLE_ENTITY,
      //     'REGISTERKAN AKUN AD!',
      //   );
      // }

      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.EMAIL_NOT_EXISTS,
      );
    } else if (user && user.userRoles.length == 0) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.EMAIL_NOT_EXISTS,
      );
    }

    if (
      onlyAdmin &&
      !user.userRoles.some(
        (b) =>
          b.roleData &&
          (b.roleData.grant_all_access || b.roleData.roleAccess.length > 0),
      )
    ) {
      throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.FORBIDDEN);
    }

    if (authConfig().emailVerification && user.hash != null) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (isValidPassword) {
      const token = await this.jwtService.sign({
        id: user.id,
        role: user.userRoles,
      });

      await this.activityLogService.create({
        user_id: user.id,
        description: `Melakukan Login ${onlyAdmin ? 'CMS' : 'Website'}`,
        ip: ip,
      });

      let menus = null;
      if (
        user.userRoles.find((e) => {
          return e.roleData.grant_all_access;
        })
      ) {
        menus = await this.menuRepository.find();
      }

      return { token, user: user, menus };
    } else {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.PASSWORD_WRONG,
      );
    }
  }

  async validateLoginCustomExpiration(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
    ip: string,
  ): Promise<{ token: string; user: User; menus: Menu[] }> {
    if (!loginDto.expiration || !isNumber(loginDto.expiration)) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Expiration tidak boleh kosong',
      );
    }

    const user = await this.usersService.findOneFull({
      email: loginDto.email,
    });

    if (!user) {
      //check Active Directory user
      const ADResult = await new ActiveDirectoryUtils().authAD(
        loginDto.email,
        loginDto.password,
      );

      if (!ADResult || !ADResult.code || ADResult.code != 0) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          `${ErrorMessage.EMAIL_NOT_EXISTS} (${ADResult.code} : ${ADResult.description})`,
        );
      } else {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'REGISTERKAN AKUN AD DISINI!',
        );
      }
    } else if (user && user.userRoles.length == 0) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.EMAIL_NOT_EXISTS,
      );
    }

    if (
      onlyAdmin &&
      !user.userRoles.some(
        (b) =>
          b.roleData &&
          (b.roleData.grant_all_access || b.roleData.roleAccess.length > 0),
      )
    ) {
      throw failedResponse(HttpStatus.FORBIDDEN, ErrorMessage.USER_NOT_FOUND);
    }

    if (authConfig().emailVerification && user.hash != null) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (isValidPassword) {
      const token = await this.jwtService.sign(
        {
          id: user.id,
          role: user.userRoles,
        },
        { expiresIn: `${loginDto.expiration}s` },
      );

      await this.activityLogService.create({
        user_id: user.id,
        description: `Melakukan Login ${onlyAdmin ? 'CMS' : 'Website'}`,
        ip: ip,
      });

      let menus = null;
      if (
        user.userRoles.find((e) => {
          return e.roleData.grant_all_access;
        })
      ) {
        menus = await this.menuRepository.find();
      }

      return { token, user: user, menus };
    } else {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.PASSWORD_WRONG,
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
    ip: string,
  ): Promise<{ token: string; user: User }> {
    const socialEmail = socialData.email?.toLowerCase();

    const user = await this.usersService.findOneFull({
      email: socialEmail,
    });

    if (user || (user && user.userRoles.length == 0)) {
      user.provider = authProvider;
      await this.usersService.update(user.id, user, user, ip);
    } else {
      throw failedResponse(HttpStatus.NOT_FOUND, ErrorMessage.EMAIL_NOT_EXISTS);
    }

    const jwtToken = await this.jwtService.sign({
      id: user.id,
      role: user.userRoles,
    });

    return {
      token: jwtToken,
      user,
    };
  }

  async register(
    photo: BufferedFile,
    dto: AuthRegisterLoginDto,
    ip: string,
  ): Promise<void> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const user = await this.usersService.create(
      {
        ...dto,
        email: dto.email,
        role_id: RoleEnum.user,
        status: 1,
        name: dto.name,
        provider: AuthProvidersEnum.email,
        notification_token: null,
        hash: hash,
        categories: null,
      },
      null,
      photo,
      ip,
    );

    if (dto.categories) {
      const saveData = [];
      dto.categories.map((data) => {
        data.topic_id.map((dataa) => {
          saveData.push({
            user_id: user.id,
            category_id: data.category_id,
            topic_id: dataa,
          });
        });
      });

      await this.usersService.createUserTopic(saveData, user.id);
    }

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

    if (!user || (user && user.userRoles.length == 0)) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.EMAIL_NOT_EXISTS,
      );
    }

    user.hash = null;
    user.status = 1;
    await user.save();
  }

  async forgotPassword(
    email: string,
    ip: string,
    isAdmin: boolean,
  ): Promise<void> {
    const user = await this.usersService.findOne({
      email,
    });

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');
    await this.forgotService.create({
      hash,
      userData: user,
      ip: ip,
      forgot_admin: isAdmin,
    });

    await this.mailService.forgotPassword({
      to: email,
      data: {
        hash,
        isAdmin,
      },
    });
  }

  async resetPassword(
    hash: string,
    password: string,
    ip: string,
  ): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
      );
    }

    const user = forgot.userData;
    user.password = password;
    await user.save();

    await this.activityLogService.create({
      user_id: user.id,
      description: 'Reset Password',
      ip: ip,
    });

    await this.forgotService.softDelete(forgot.id);

    return ResetPasswordResource(
      forgot.forgot_admin ? appConfig().cmsDomain : appConfig().frontendDomain,
    );
  }

  async resetPasswordData(hash: string): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
      );
    }

    return ResetPasswordDataResource(forgot.userData);
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
    ip: string,
    photo?: BufferedFile,
  ): Promise<User> {
    if (userDto.email) {
      const userWithEmail = await this.usersService.findOneFull({
        email: userDto.email,
      });

      if (userWithEmail && userWithEmail.id != user.id) {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Email telah digunakan');
      }
    }

    await this.usersService.update(user.id, userDto, user, ip, photo);

    if (userDto.topics && userDto.topics.length > 0) {
      await this.usersService.createUserTopic(userDto.topics, user.id);
    }

    this.redisService.del(`${RedisKeyEnum.user}:${user.id}`);

    return await this.usersService.findOne({
      id: user.id,
    });
  }

  async changePassword(
    user: User,
    userDto: AuthUpdatePasswordDto,
    ip: string,
  ): Promise<User> {
    const currentUser = await this.usersService.findOneFull({
      id: user.id,
    });

    if (!currentUser || (currentUser && currentUser.userRoles.length == 0)) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.EMAIL_NOT_EXISTS,
      );
    }

    const isValidOldPassword = await bcrypt.compare(
      userDto.oldPassword,
      currentUser.password,
    );

    if (!isValidOldPassword) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.PASSWORD_WRONG,
      );
    }

    await this.usersService.update(user.id, userDto, user, ip);

    this.redisService.del(`${RedisKeyEnum.user}:${user.id}`);

    return await this.usersService.findOne({
      id: user.id,
    });
  }

  async softDelete(user: User, ip: string): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.user}:${user.id}`);
    await this.usersService.softDelete(user.id, user, ip);
  }

  async logout(user: User, ip: string) {
    await this.usersService.logout(user, ip);
  }
}
