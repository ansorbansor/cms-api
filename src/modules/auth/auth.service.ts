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
  FilePath,
  RedisKeyEnum,
  RoleEnum,
} from 'src/utils/enums';
import fetch from 'node-fetch';
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
import { BufferedFile, getFileExtension } from 'src/utils/file-helper';
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
import simsdmConfig from 'src/config/simsdm.config';
import { encryptText } from 'src/utils/encryption-helper';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { FilesService } from '../files/files.service';
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
    private fileService: FilesService,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(EmployeeLevel)
    private employeeLevelRepository: Repository<EmployeeLevel>,
    @InjectRepository(EmployeePosition)
    private employeePositionRepository: Repository<EmployeePosition>,
    @InjectRepository(EmployeeUnit)
    private employeeUnitRepository: Repository<EmployeeUnit>,
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
    let user = await this.usersService.findOneFull({ nip: loginDto.nip });

    if (!user && !onlyAdmin && authConfig().activateLDAP == 'true') {
      //check Active Directory user
      const ADResult = await new ActiveDirectoryUtils().authAD(
        `${loginDto.nip}@setneg.go.id`,
        loginDto.password,
      );

      if (!ADResult) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          `${ErrorMessage.NIP_NOT_EXISTS}`,
        );
      } else {
        try {
          let simsdmData = await fetch(`${simsdmConfig().url}${loginDto.nip}`);

          simsdmData = await simsdmData.json();

          if (Array.isArray(simsdmData) && simsdmData.length > 0) {
            simsdmData = simsdmData[0];
          }

          const adHelper = new ActiveDirectoryUtils();

          //set dto register for new user
          const dto = new AuthRegisterLoginDto();
          dto.email = adHelper.decryptSIMSDMData(simsdmData.email)
            ? adHelper.decryptSIMSDMData(simsdmData.email)
            : adHelper.decryptSIMSDMData(simsdmData.email_dinas)
            ? adHelper.decryptSIMSDMData(simsdmData.email_dinas)
            : loginDto.nip;
          dto.name = adHelper.decryptSIMSDMData(simsdmData.nmpeg)
            ? adHelper.decryptSIMSDMData(simsdmData.nmpeg)
            : `User ${loginDto.nip}`;
          dto.nip = adHelper.decryptSIMSDMData(simsdmData.nipbaru)
            ? adHelper.decryptSIMSDMData(simsdmData.nipbaru)
            : adHelper.decryptSIMSDMData(simsdmData.niplama)
            ? adHelper.decryptSIMSDMData(simsdmData.niplama)
            : adHelper.decryptSIMSDMData(simsdmData.pns_niplama)
            ? adHelper.decryptSIMSDMData(simsdmData.pns_niplama)
            : loginDto.nip;
          dto.password = loginDto.password;

          //find existing position
          let position = await this.employeePositionRepository.findOne({
            where: {
              name: adHelper.decryptSIMSDMData(simsdmData.jabatanakhir),
            },
          });

          //create position if not exists
          if (!position) {
            position = await this.employeePositionRepository.save({
              name: adHelper.decryptSIMSDMData(simsdmData.jabatanakhir),
            });
          }

          dto.position_id = position.id;
          dto.provider = AuthProvidersEnum.ldap;
          dto.role_id = RoleEnum.user; //hardcoded user
          dto.status = 1;

          //find existing level
          let level = await this.employeeLevelRepository.findOne({
            where: {
              name: adHelper.decryptSIMSDMData(simsdmData.pangkatakhir),
            },
          });

          //create level if not exists
          if (!level) {
            level = await this.employeeLevelRepository.save({
              name: adHelper.decryptSIMSDMData(simsdmData.pangkatakhir),
            });
          }

          dto.level_id = level.id;

          //find existing unit
          let unit = await this.employeeUnitRepository.findOne({
            where: {
              name: adHelper.decryptSIMSDMData(simsdmData.satorg),
            },
          });

          //create unit if not exists
          if (!unit) {
            unit = await this.employeeUnitRepository.save({
              name: adHelper.decryptSIMSDMData(simsdmData.satorg),
            });
          }
          dto.unit_id = unit.id;

          dto.level = 0;
          dto.photo = null;

          user = await this.register(null, dto, ip);

          if (adHelper.decryptSIMSDMData(simsdmData.foto)) {
            try {
              const fileExt = getFileExtension(
                adHelper.decryptSIMSDMData(simsdmData.foto),
              );
              const res = await fetch(
                `${simsdmConfig().imageUrl}/${adHelper.decryptSIMSDMData(
                  simsdmData.foto,
                )}`,
              );

              const resBuffer = await res.buffer();

              //save get image
              const photo = await this.fileService.uploadWithMinioBuffer(
                resBuffer,
                user.id,
                `${user.nip}.${fileExt}`,
                FilePath.USER,
                'User Photo',
              );

              await this.userRepository.update(user.id, {
                photo: photo.id,
              });
            } catch (err) {
              console.log(err);
            }
          }
        } catch (e) {
          console.log(e);
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorMessage.USER_NOT_FOUND,
          );
        }
      }
    }

    if (!user) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorMessage.NIP_NOT_EXISTS,
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
      const token = this.jwtService.sign({
        id: await encryptText(user.id),
        role: await Promise.all(
          user.userRoles.map(async (e) => {
            return {
              roleData: {
                id: await encryptText(e.roleData.id),
                grant_all_access: await encryptText(
                  e.roleData.grant_all_access,
                ),
                roleAccess: await Promise.all(
                  e.roleData.roleAccess.map(async (role) => {
                    return {
                      be_controller: await encryptText(role.menu.be_controller),
                      menu_access: await encryptText(role.menu_access),
                    };
                  }),
                ),
              },
            };
          }),
        ),
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
      email: loginDto.nip,
    });

    if (!user) {
      //check Active Directory user
      const ADResult = await new ActiveDirectoryUtils().authAD(
        loginDto.nip,
        loginDto.password,
      );

      if (!ADResult || !ADResult.code || ADResult.code != 0) {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          `${ErrorMessage.NIP_NOT_EXISTS} (${ADResult.code} : ${ADResult.description})`,
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
        ErrorMessage.NIP_NOT_EXISTS,
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
      const token = this.jwtService.sign({
        id: await encryptText(user.id),
        role: await Promise.all(
          user.userRoles.map(async (e) => {
            return {
              roleData: {
                id: await encryptText(e.roleData.id),
                grant_all_access: await encryptText(
                  e.roleData.grant_all_access,
                ),
                roleAccess: await Promise.all(
                  e.roleData.roleAccess.map(async (role) => {
                    return {
                      be_controller: await encryptText(role.menu.be_controller),
                      menu_access: await encryptText(role.menu_access),
                    };
                  }),
                ),
              },
            };
          }),
        ),
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

    const token = this.jwtService.sign({
      id: await encryptText(user.id),
      role: await Promise.all(
        user.userRoles.map(async (e) => {
          return {
            roleData: {
              id: await encryptText(e.roleData.id),
              grant_all_access: await encryptText(e.roleData.grant_all_access),
              roleAccess: await Promise.all(
                e.roleData.roleAccess.map(async (role) => {
                  return {
                    be_controller: await encryptText(role.menu.be_controller),
                    menu_access: await encryptText(role.menu_access),
                  };
                }),
              ),
            },
          };
        }),
      ),
    });

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
    ip: string,
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
