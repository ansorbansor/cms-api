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
    photo: Express.Multer.File,
    user: User,
  ) {
    const img = await this.fileService.uploadFile(photo, user);

    const category = await this.categoryRepository.save(
      this.categoryRepository.create({
        name: createCourseCategoryDto.name,
        photo: img.id,
      }),
    );

    return this.findOne({ id: category.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.categoryRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.categoryRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      CourseCategoryResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<CourseCategory>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.category}${fields.id}`,
      typeof CourseCategoryResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.categoryRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.category}${fields.id}`, data);

    return CourseCategoryResource(data);
  }

  async update(
    updateCourseCategoryDto: UpdateCourseCategoryDto,
    photo: Express.Multer.File,
    user: User,
  ) {
    const exists = await this.findOne({ id: updateCourseCategoryDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    const img = await this.fileService.uploadFile(photo, user);

    await this.categoryRepository.update(updateCourseCategoryDto.id, {
      ...UpdateCourseCategoryDto,
      photo: img.id,
    });

    this.redisService.del(
      `${RedisKeyEnum.category}${updateCourseCategoryDto.id}`,
    );

    return await this.findOne({ id: updateCourseCategoryDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.category}${id}`);
    await this.categoryRepository.softDelete(id);
  }
}
