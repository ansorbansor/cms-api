import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { In, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { BannerType, RedisKeyEnum } from 'src/utils/enums';
import { Banner } from 'src/entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { BannerResource } from './resources/banner.resources';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { User } from 'src/entities/user.entity';
import { BufferedFile } from 'src/utils/file-helper';
import { FilesService } from '../files/files.service';
import { Course } from 'src/entities/course.entity';
import { UpdateBannerPositionDto } from './dto/update-banner-position.dto';
import { isNumber } from 'class-validator';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    private redisService: RedisService,
    private fileService: FilesService,
  ) {}

  async create(
    createBannerDto: CreateBannerDto,
    user: User,
    photo: BufferedFile,
  ) {
    if (!photo) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Photo tidak boleh kosong',
      );
    }

    switch (createBannerDto.type.toString()) {
      case BannerType.COURSE: {
        if (!createBannerDto.course_id) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'course_id tidak boleh kosong',
          );
        } else if (
          !(await this.courseRepository.findOne({
            id: createBannerDto.course_id,
          }))
        ) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'Course tidak tersedia',
          );
        }
        createBannerDto.external_url = null;
        createBannerDto.content = null;
        break;
      }
      case BannerType.EXTERNAL_URL: {
        if (!createBannerDto.external_url) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'external_url tidak boleh kosong',
          );
        }
        createBannerDto.course_id = null;
        createBannerDto.content = null;
        break;
      }
      case BannerType.ANNOUNCEMENT: {
        if (!createBannerDto.content) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'content tidak boleh kosong',
          );
        }
        createBannerDto.external_url = null;
        createBannerDto.course_id = null;
        break;
      }
    }

    const img = await this.fileService.uploadWithMinio(photo, user.id);
    createBannerDto.photo = img;

    const category = await this.bannerRepository.save(
      this.bannerRepository.create({
        ...createBannerDto,
      }),
    );

    await this.redisService.del(`${RedisKeyEnum.banner}:`);

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const redisKey = `${RedisKeyEnum.banner}:-Page${paginationOptions.page}-Limit${paginationOptions.limit}-Search${paginationOptions.search}-Status${paginationOptions.status}-Type${paginationOptions.type}`;

    const value = await this.redisService.get(redisKey, typeof BannerResource);
    if (value != null) {
      return value;
    }

    const data = this.bannerRepository
      .createQueryBuilder('banner')
      .leftJoinAndSelect('banner.photoFile', 'photoFile')
      .leftJoinAndSelect('banner.course', 'course');

    if (paginationOptions.search) {
      data.andWhere(
        `LOWER(banner.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
    }

    if (paginationOptions.status_bool) {
      data.andWhere('banner.status = :status', {
        status: paginationOptions.status_bool,
      });
    }

    if (paginationOptions.type != null && isNumber(paginationOptions.type)) {
      data.andWhere('banner.type = :type', {
        type: paginationOptions.type,
      });
    }

    data.orderBy('banner.position', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);
    const getData = await data.getMany();

    const returnData = infinityPagination(
      getData,
      BannerResource,
      paginationOptions,
    );

    this.redisService.set(redisKey, returnData);

    return returnData;
  }

  async findOne(fields: EntityCondition<Banner>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.banner}:${fields.id}`,
      typeof BannerResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.bannerRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Banner tidak ditemukan',
      );
    }

    this.redisService.set(
      `${RedisKeyEnum.banner}:${fields.id}`,
      BannerResource(data),
    );

    return BannerResource(data);
  }

  async update(
    updateBannerDto: UpdateBannerDto,
    user: User,
    photo: BufferedFile,
  ) {
    const exists = await this.findOne({ id: updateBannerDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Banner tidak ditemukan',
      );
    }

    if (!photo) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Photo tidak boleh kosong',
      );
    }
    switch (updateBannerDto.type.toString()) {
      case BannerType.COURSE: {
        if (!updateBannerDto.course_id) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'course_id tidak boleh kosong',
          );
        } else if (
          !(await this.courseRepository.findOne({
            id: updateBannerDto.course_id,
          }))
        ) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'Course tidak tersedia',
          );
        }
        updateBannerDto.external_url = null;
        updateBannerDto.content = null;
        break;
      }
      case BannerType.EXTERNAL_URL: {
        if (!updateBannerDto.external_url) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'external_url tidak boleh kosong',
          );
        }
        updateBannerDto.course_id = null;
        updateBannerDto.content = null;
        break;
      }
      case BannerType.ANNOUNCEMENT: {
        if (!updateBannerDto.content) {
          throw failedResponse(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'content tidak boleh kosong',
          );
        }
        updateBannerDto.external_url = null;
        updateBannerDto.course_id = null;
        break;
      }
    }

    const img = await this.fileService.uploadWithMinio(photo, user.id);
    updateBannerDto.photo = img;

    await this.bannerRepository.update(updateBannerDto.id, {
      ...updateBannerDto,
    });

    await this.redisService.del(`${RedisKeyEnum.banner}:`);

    return await this.findOne({ id: updateBannerDto.id });
  }

  async updatePosition(updateBannerPositionDto: UpdateBannerPositionDto[]) {
    const banner_id = [];
    updateBannerPositionDto.forEach((element) => {
      banner_id.push(element.banner_id);
    });
    const checkExists = await this.bannerRepository.find({
      where: {
        id: In(banner_id),
      },
    });

    if (checkExists.length != banner_id.length) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Banner tidak tersedia',
      );
    }

    updateBannerPositionDto.forEach(async (element) => {
      await this.bannerRepository.update(element.banner_id, {
        position: element.position,
      });
    });

    await this.redisService.del(`${RedisKeyEnum.banner}:`);
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.banner}:${id}`);
    await this.bannerRepository.softDelete(id);
  }
}
