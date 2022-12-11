import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordService } from '../forgot-password/forgot-password.service';
import { MailService } from '../mail/mail.service';
import { User } from 'src/entities/user.entity';
import { AuthProvidersEnum, ErrorMessage, RoleEnum } from 'src/utils/enums';
import { AuthEmailLoginDto } from './dtos/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dtos/auth-register-login.dto';
import { AuthUpdateDto } from './dtos/auth-update.dto';
import { failedResponse } from 'src/utils/responses';
import authConfig from 'src/config/auth.config';
import { ConfigService } from '@nestjs/config';
import { BufferedFile } from 'src/utils/file-helper';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ResetPasswordDataResource } from './resources/reset-password-data.resources';
import { ResetPasswordResource } from './resources/reset-password.resources';
import appConfig from 'src/config/app.config';
import { AuthUpdatePasswordDto } from './dtos/auth-update-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { encryptText } from 'src/utils/encryption-helper';
import * as moment from 'moment';
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
  ) {}

  async validateLogin(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
    ip: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOneFull({ email: loginDto.email });

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

    if (onlyAdmin && !user.userRoles.some((b) => b.roleData)) {
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
      await this.activityLogService.create({
        user_id: user.id,
        description: `Melakukan Login ${onlyAdmin ? 'CMS' : 'Website'}`,
        ip: ip,
      });

      const token = await this.generateToken(user);

      return { token, user: user };
    } else {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.PASSWORD_WRONG,
      );
    }
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
        employee_position_id: dto.employee_position_id,
      },
      null,
      photo,
      ip,
    );

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
    const me = await this.usersService.findOne({ id: user.id });
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
