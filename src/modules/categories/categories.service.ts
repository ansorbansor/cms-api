import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { Category } from 'src/entities/category.entity';
import { CategoryResource } from './resources/category.resources';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilesService } from '../files/files.service';
import { User } from 'src/entities/user.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    private redisService: RedisService,
    private fileService: FilesService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    photo: Express.Multer.File,
    user: User,
  ) {
    const img = await this.fileService.uploadFile(photo, user);

    const category = await this.categoryRepository.save(
      this.categoryRepository.create({
        name: createCategoryDto.name,
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
      CategoryResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Category>) {
    const data = await this.categoryRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyedia tidak ditemukan',
      );
    }

    return CategoryResource(data);
  }

  async update(id: number, UpdateCategoryDto: UpdateCategoryDto) {
    const exists = await this.findOne({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyedia tidak ditemukan',
      );
    }

    await this.categoryRepository.update(id, {
      ...UpdateCategoryDto,
    });

    this.redisService.del(`${RedisKeyEnum.category}${id}`);

    return await this.findOne({ id: id });
  }

  async softDelete(id: number): Promise<void> {
    await this.categoryRepository.softDelete(id);
  }
}
