import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { CourseCategoryResource } from './resources/course-category.resources';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';
import { FilesService } from '../files/files.service';
import { User } from 'src/entities/user.entity';
import { CourseCategory } from 'src/entities/course-category.entity';
import { BufferedFile } from 'src/utils/file-helper';

@Injectable()
export class CourseCategoriesService {
  constructor(
    @InjectRepository(CourseCategory)
    private categoryRepository: Repository<CourseCategory>,

    private redisService: RedisService,
    private fileService: FilesService,
  ) {}

  async create(
    createCourseCategoryDto: CreateCourseCategoryDto,
    photo: BufferedFile,
    user: User,
  ) {
    if (!photo) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Photo tidak boleh kosong',
      );
    }

    const img = await this.fileService.uploadWithMinio(photo, user.id);
    createCourseCategoryDto.photo = img;

    const category = await this.categoryRepository.save(
      this.categoryRepository.create({
        ...createCourseCategoryDto,
      }),
    );

    return this.findOne({ id: category.id }, false);
  }

  async findManyWithPagination(
    paginationOptions: IPaginationOptions,
    withTopics?: boolean,
  ) {
    const redisKey = `${RedisKeyEnum.category}:-Page${paginationOptions.page}-Limit${paginationOptions.limit}-Search${paginationOptions.search}`;

    const value = await this.redisService.get(
      redisKey,
      typeof CourseCategoryResource,
    );
    if (value != null) {
      return infinityPagination(
        value,
        CourseCategoryResource,
        paginationOptions,
      );
    }

    const data = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.photoFile', 'photoFile');

    if (withTopics) {
      data.leftJoinAndSelect('category.topic', 'topic');
    }

    if (paginationOptions.search) {
      data.andWhere(
        `LOWER(category.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const getData = await data.getMany();

    this.redisService.set(redisKey, getData);

    return infinityPagination(
      getData,
      CourseCategoryResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CourseCategory>, withTopics?: boolean) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.category}:${fields.id}`,
      typeof CourseCategoryResource,
    );
    if (value != null) {
      return value;
    }

    const relation = ['course'];
    if (withTopics) {
      relation.push('topic');
    }

    const data = await this.categoryRepository.findOne({
      where: fields,
      relations: relation,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.category}:${fields.id}`, data);

    return CourseCategoryResource(data);
  }

  async update(
    updateCourseCategoryDto: UpdateCourseCategoryDto,
    photo: BufferedFile,
    user: User,
  ) {
    const exists = await this.findOne(
      { id: updateCourseCategoryDto.id },
      false,
    );

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    const img = await this.fileService.uploadWithMinio(photo, user.id);

    await this.categoryRepository.update(updateCourseCategoryDto.id, {
      ...updateCourseCategoryDto,
      photo: img.id,
    });

    this.redisService.del(`${RedisKeyEnum.category}`);
    this.redisService.del(`${RedisKeyEnum.course}`);

    return await this.findOne({ id: updateCourseCategoryDto.id }, true);
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.category}:${id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);
    await this.categoryRepository.softDelete(id);
  }
}
