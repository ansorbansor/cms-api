import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { failedResponse, successResponse } from 'src/utils/responses';
import { UserCourse } from 'src/entities/user-course.entity';
import { User } from 'src/entities/user.entity';
import { FinishCourseDto } from '../coupon-submission/dto/finish-course.dto';
import { FinishCourseResource } from './resources/finish-course.resources';
import { PartnerLoginDto } from './dto/partner-login.dto';
import { OauthClient } from 'src/entities/oauth-client.entity';
import { ErrorMessage, RedisKeyEnum } from 'src/utils/enums';
import { JwtService } from '@nestjs/jwt';
import { encryptText } from 'src/utils/encryption-helper';
import { LoginPartnerResource } from './resources/login-partner.resources';
import * as crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { GeneratePartnerResource } from './resources/generate-partner.resources';
import { GeneratePartnerDto } from './dto/generate-partner.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PartnerService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OauthClient)
    private oauthClientRepository: Repository<OauthClient>,
    private redisService: RedisService,
  ) {}

  async validateLogin(loginDto: PartnerLoginDto): Promise<any> {
    const client = await this.oauthClientRepository
      .createQueryBuilder('client')
      .where('id = :id AND secret = :secret', {
        id: loginDto.client_id,
        secret: loginDto.client_secret,
      })
      .getOne();

    if (!client) {
      throw failedResponse(
        HttpStatus.FORBIDDEN,
        ErrorMessage.PARTNER_NOT_EXISTS,
      );
    }

    const token = this.jwtService.sign({
      client_id: await encryptText(client.id),
      client_secret: await encryptText(client.secret),
    });

    return LoginPartnerResource(client.name, token);
  }

  async generatePartner(generateDto: GeneratePartnerDto): Promise<any> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const client = await this.oauthClientRepository.save(
      this.oauthClientRepository.create({
        name: generateDto.name,
        secret: hash,
      }),
    );

    return GeneratePartnerResource(client);
  }

  async finishCourse(dto: FinishCourseDto) {
    const user = await this.userRepository.findOne({ nip: dto.nip });

    if (!user) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'NIP tidak ditemukan');
    }

    const userCourse = await this.userCourseRepository.findOne({
      user_id: user.id,
      course_id: dto.course_id,
    });

    if (!userCourse) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Pembelajaran pengguna tidak ditemukan',
      );
    }

    await this.userCourseRepository.update(userCourse.id, {
      progress: 100,
      certificate_date: dto.certificate_date,
      certificate_number: dto.certificate_number,
      certificate_image: dto.certificate_image,
    });

    this.redisService.del(`${RedisKeyEnum.course}:`);

    return successResponse(
      FinishCourseResource(dto),
      'Berhasil menyelesaikan pelatihan!',
    );
  }
}
