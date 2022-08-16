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
    const img = await this.fileService.uploadWithMinio(photo, user.id);

    const category = await this.categoryRepository.save(
      this.categoryRepository.create({
        name: createCourseCategoryDto.name,
        photo: img.id,
      }),
    );

    return this.findOne({ id: category.id }, false);
  }

  async findManyWithPagination(
    paginationOptions: IPaginationOptions,
    withTopics: boolean,
  ) {
    const total = await this.categoryRepository.count();
    paginationOptions.total = total;

    const relation = [];
    if (withTopics) {
      relation.push('topic');
    }

    return infinityPagination(
      await this.categoryRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        relations: relation,
      }),
      CourseCategoryResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CourseCategory>, withTopics: boolean) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.category}:${fields.id}`,
      typeof CourseCategoryResource,
    );
    if (value != null) {
      return value;
    }

    const relation = [];
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
      ...UpdateCourseCategoryDto,
      photo: img.id,
    });

    this.redisService.del(
      `${RedisKeyEnum.category}:${updateCourseCategoryDto.id}`,
    );

    return await this.findOne({ id: updateCourseCategoryDto.id }, true);
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.category}:${id}`);
    await this.categoryRepository.softDelete(id);
  }
}
