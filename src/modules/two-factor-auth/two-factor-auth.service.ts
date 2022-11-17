import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { User } from 'src/entities/user.entity';
import { UsersService } from '../users/users.service';
import { toDataURL } from 'qrcode';
import { failedResponse } from 'src/utils/responses';
import {
  AuthProvidersEnum,
  ErrorMessage,
  FilePath,
  RoleEnum,
} from 'src/utils/enums';
import { TwoFactorAuthDto } from '../auth/dtos/two-factor-auth.dto';
import authConfig from 'src/config/auth.config';
import simsdmConfig from 'src/config/simsdm.config';
import { ActiveDirectoryUtils } from 'src/utils/active-directory-utils';
import { getFileExtension } from 'src/utils/file-helper';
import { AuthRegisterLoginDto } from '../auth/dtos/auth-register-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { AuthService } from '../auth/auth.service';
import fetch from 'node-fetch';
import * as bcrypt from 'bcryptjs';
import { TwoFactorAuthResource } from './resources/two-factor-auth.resources';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private fileService: FilesService,
    @InjectRepository(EmployeeLevel)
    private employeeLevelRepository: Repository<EmployeeLevel>,
    @InjectRepository(EmployeePosition)
    private employeePositionRepository: Repository<EmployeePosition>,
    @InjectRepository(EmployeeUnit)
    private employeeUnitRepository: Repository<EmployeeUnit>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async generateTwoFactorAuthenticationSecret(
    authDto: TwoFactorAuthDto,
    onlyAdmin: boolean,
    ip: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.roleData', 'role')
      .where('user.nip = :nip', { nip: authDto.nip })
      .orWhere('user.nip_lama = :nip', { nip: authDto.nip })
      .getOne();

    if (!user && !onlyAdmin && authConfig().activateLDAP == 'true') {
      let simsdmData = await fetch(`${simsdmConfig().url}${authDto.nip}`);

      simsdmData = await simsdmData.json();

      if (Array.isArray(simsdmData)) {
        simsdmData = simsdmData[0];
      }

      const adHelper = new ActiveDirectoryUtils();

      if (simsdmData) {
        //check Active Directory user with nip baru
        let ADResult = await new ActiveDirectoryUtils().authAD(
          `${adHelper.decryptSIMSDMData(simsdmData.nipbaru)}@setneg.go.id`,
          authDto.password,
        );

        //check Active Directory user with nip lama if nip baru not authenticate
        if (!ADResult) {
          ADResult = await new ActiveDirectoryUtils().authAD(
            `${adHelper.decryptSIMSDMData(simsdmData.niplama)}@setneg.go.id`,
            authDto.password,
          );
        }

        if (!ADResult) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            `${ErrorMessage.USER_NOT_FOUND}`,
          );
        } else {
          try {
            //set dto register for new user
            const dto = new AuthRegisterLoginDto();
            dto.email = adHelper.decryptSIMSDMData(simsdmData.email)
              ? adHelper.decryptSIMSDMData(simsdmData.email)
              : adHelper.decryptSIMSDMData(simsdmData.email_dinas)
              ? adHelper.decryptSIMSDMData(simsdmData.email_dinas)
              : authDto.nip;
            dto.name = adHelper.decryptSIMSDMData(simsdmData.nmpeg)
              ? adHelper.decryptSIMSDMData(simsdmData.nmpeg)
              : `User ${authDto.nip}`;
            dto.nip = adHelper.decryptSIMSDMData(simsdmData.nipbaru)
              ? adHelper.decryptSIMSDMData(simsdmData.nipbaru)
              : adHelper.decryptSIMSDMData(simsdmData.niplama)
              ? adHelper.decryptSIMSDMData(simsdmData.niplama)
              : adHelper.decryptSIMSDMData(simsdmData.pns_niplama)
              ? adHelper.decryptSIMSDMData(simsdmData.pns_niplama)
              : authDto.nip;
            dto.nip_lama = adHelper.decryptSIMSDMData(simsdmData.niplama)
              ? adHelper.decryptSIMSDMData(simsdmData.niplama)
              : adHelper.decryptSIMSDMData(simsdmData.pns_niplama)
              ? adHelper.decryptSIMSDMData(simsdmData.pns_niplama)
              : authDto.nip;

            dto.password = authDto.password;

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

            const user = await this.authService.register(null, dto, ip);

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
      } else {
        throw failedResponse(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorMessage.USER_NOT_FOUND,
        );
      }
    }

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
      authDto.password,
      user.password,
    );

    if (isValidPassword) {
      let secret = user.two_factor_auth_code;
      if (!secret) {
        secret = authenticator.generateSecret();
      }

      const otpauthUrl = authenticator.keyuri(
        user.email,
        this.configService.get('app.name'),
        secret,
      );

      await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);

      return TwoFactorAuthResource(
        await this.pipeQrCodeStream(otpauthUrl),
        user,
      );
    }

    throw failedResponse(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorMessage.PASSWORD_WRONG,
    );
  }

  public async pipeQrCodeStream(otpauthUrl: string) {
    return toDataURL(otpauthUrl);
  }

  isTwoFactorAuthenticationCodeValid(
    twoFactorAuthenticationCode: string,
    user: User,
  ) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.two_factor_auth_code,
    });
  }
}
