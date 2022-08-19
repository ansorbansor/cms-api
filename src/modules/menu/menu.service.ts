import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { Menu } from 'src/entities/menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuResource } from './resource/menu.resources';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const topic = await this.menuRepository.save(
      this.menuRepository.create({
        ...createMenuDto,
      }),
    );

    return this.findOne({ id: topic.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.menuRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.menuRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      MenuResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Menu>) {
    const data = await this.menuRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Topic tidak ditemukan',
      );
    }

    return MenuResource(data);
  }

  async update(updateMenuDto: UpdateMenuDto) {
    const exists = await this.findOne({ id: updateMenuDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Topic tidak ditemukan',
      );
    }

    await this.menuRepository.update(updateMenuDto.id, {
      ...updateMenuDto,
    });

    return await this.findOne({ id: updateMenuDto.id });
  }

  async softDelete(id: number): Promise<void> {
    await this.menuRepository.softDelete(id);
  }
}
