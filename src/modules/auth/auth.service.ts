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
import { getManager, Repository } from 'typeorm';
import { isNumber } from 'class-validator';
import { encryptText } from 'src/utils/encryption-helper';
import { authenticator } from 'otplib';
import * as moment from 'moment';
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    const user = await this.usersService.findOneFull({ nip: loginDto.nip });

    if (!user) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
      );
    } else if (user && user.userRoles.length == 0) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.FORBIDDEN,
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
      const twoFAVerify = authenticator.verify({
        token: loginDto.two_factor_auth_code,
        secret: user.two_factor_auth_code,
      });

      if (!twoFAVerify) {
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          ErrorMessage.TWO_FACTOR_AUTH_FAILED,
        );
      }

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

      const token = await this.generateToken(user);

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
      nip: loginDto.nip,
    });

    if (!user) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
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

      const token = await this.generateToken(user);

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
      .catch((err) => {
        console.log(`Firebase Auth Error (${err})`);
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

    const user = await this.usersService.findOneFull({
      email: socialEmail,
    });

    if (user || (user && user.userRoles.length == 0)) {
      await this.userRepository.update(user.id, {
        provider: authProvider,
      });
    } else {
      throw failedResponse(HttpStatus.NOT_FOUND, ErrorMessage.EMAIL_NOT_EXISTS);
    }

    const token = await this.generateToken(user);

    return {
      token: token,
      user,
    };
  }

  async register(
    photo: BufferedFile,
    dto: AuthRegisterLoginDto,
    ip: string,
  ): Promise<User> {
    const hash =
      authConfig().emailVerification == 'true'
        ? crypto
            .createHash('sha256')
            .update(randomStringGenerator())
            .digest('hex')
        : null;

    const user = await this.usersService.create(
      {
        ...dto,
        email: dto.email,
        role_id: RoleEnum.user,
        status: 1,
        name: dto.name,
        provider: dto.provider ? dto.provider : AuthProvidersEnum.email,
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

    return user;
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
  ): Promise<User> {
    const currentUser = await this.usersService.findOneFull({
      id: user.id,
    });

    if (!currentUser || (currentUser && currentUser.userRoles.length == 0)) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
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

    await this.userRepository.save(
      this.userRepository.create({
        id: user.id,
        password: userDto.password,
      }),
    );

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

  async generateToken(user: User) {
    //generate token
    const token = this.jwtService.sign({
      id: await encryptText(user.id),
    });

    //revoke other token
    await getManager().query(
      `UPDATE oauth_tokens SET revoked = 1 WHERE user_id = ${user.id}`,
    );

    //insert new token
    const expired = moment()
      .add(authConfig().expires, 'm')
      .format('YYYY-MM-DD HH:mm:ss');

    await getManager().query(
      `INSERT INTO oauth_tokens (user_id, token, expired_at) VALUES (${user.id}, '${token}', '${expired}')`,
    );

    return token;
  }

  async checkExpiredToken(token: string, userId: number) {
    let tokenData = await getManager().query(
      ` SELECT 
          id, user_id, token, expired_at, revoked 
        FROM 
          oauth_tokens 
        WHERE 
          user_id = ${userId} 
        ORDER by 
          id 
        DESC LIMIT 1`,
    );

    tokenData = tokenData[0];
    const currentDate = moment().toDate();
    const expiredDate = moment(
      tokenData.expired_at,
      'YYYY-MM-DD HH:mm:ss',
    ).toDate();

    if (
      !tokenData ||
      token != tokenData.token ||
      currentDate > expiredDate ||
      tokenData.revoked == 1
    ) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
    }

    const addedTime = moment()
      .add(authConfig().expires, 'm')
      .format('YYYY-MM-DD HH:mm:ss');

    await getManager().query(
      `UPDATE oauth_tokens SET expired_at = '${addedTime}' WHERE id = ${tokenData.id}`,
    );

    return true;
  }
}
