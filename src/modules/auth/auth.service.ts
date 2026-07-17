import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordService } from '../forgot-password/forgot-password.service';
import { MailService } from '../mail/mail.service';
import { User } from 'src/entities/user.entity';
import { ErrorMessage } from 'src/utils/enums';
import { AuthEmailLoginDto } from './dtos/auth-email-login.dto';
import { failedResponse } from 'src/utils/responses';
import authConfig from 'src/config/auth.config';
import { ConfigService } from '@nestjs/config';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ResetPasswordDataResource } from './resources/reset-password-data.resources';
import { ResetPasswordResource } from './resources/reset-password.resources';
import appConfig from 'src/config/app.config';
import { AuthUpdatePasswordDto } from './dtos/auth-update-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { encryptText } from 'src/utils/encryption-helper';
import moment from 'moment';
import { AuthUpdateDto } from './dtos/auth-update.dto';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private forgotService: ForgotPasswordService,
    private mailService: MailService,
    private configService: ConfigService,
    private activityLogService: ActivityLogService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async validateLogin(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
    ip: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOneFull({
      email: loginDto.email,
      status: true,
    });

    if (!user) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
      );
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

      const token = await this.generateToken(user, onlyAdmin);

      return { token, user: user };
    } else {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.PASSWORD_WRONG,
      );
    }
  }

  async confirmEmail(hash: string): Promise<void> {
    const user = await this.usersService.findOneFull({
      hash,
    });

    if (!user) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.EMAIL_NOT_EXISTS,
      );
    }

    user.hash = null;
    user.status = true;
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
    const me = await this.usersService.findOne({ id: user.id });
    return me;
  }

  async update(user: User, authUpdateDto: AuthUpdateDto) {
    const me = await this.usersService.findOne({ id: user.id });

    if (!me) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.USER_NOT_FOUND,
      );
    }

    await this.userRepository.update(user.id, {
      email: authUpdateDto.email,
    });

    me.email = authUpdateDto.email;

    return me;
  }

  async changePassword(
    user: User,
    userDto: AuthUpdatePasswordDto,
  ): Promise<User> {
    const currentUser = await this.usersService.findOneFull({
      id: user.id,
    });

    if (!currentUser) {
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

    return await this.usersService.findOne({
      id: user.id,
    });
  }

  async softDelete(user: User, ip: string): Promise<void> {
    await this.usersService.softDelete(user.id, user, ip);
  }

  async logout(user: User, ip: string) {
    await this.usersService.logout(user, ip);
  }

  async generateToken(user: User, onlyAdmin: boolean = false) {
    let appSessionId = undefined;
    if (!onlyAdmin) {
      appSessionId = crypto.randomUUID();
      user.app_session_id = appSessionId;
      await user.save();
    }

    //generate token
    const token = this.jwtService.sign({
      id: await encryptText(user.id),
      appSessionId: appSessionId,
    });

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

    if (!tokenData) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
    }

    const currentDate = moment().toDate();
    const expiredDate = moment(
      tokenData.expired_at,
      'YYYY-MM-DD HH:mm:ss',
    ).toDate();

    if (
      !tokenData ||
      token != tokenData.token ||
      currentDate > expiredDate ||
      tokenData.revoked == true
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
