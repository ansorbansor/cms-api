import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
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

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const redisKey = `${RedisKeyEnum.banner}:`;

    const value = await this.redisService.get(redisKey, typeof BannerResource);
    if (value != null) {
      return infinityPagination(value, BannerResource, paginationOptions);
    }

    const total = await this.bannerRepository.count();
    paginationOptions.total = total;

    const getData = await this.bannerRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    this.redisService.set(redisKey, getData);

    return infinityPagination(getData, BannerResource, paginationOptions);
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

    await this.redisService.del(`${RedisKeyEnum.banner}:${updateBannerDto.id}`);

    return await this.findOne({ id: updateBannerDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.banner}:${id}`);
    await this.bannerRepository.softDelete(id);
  }
}
