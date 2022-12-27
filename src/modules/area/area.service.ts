import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Area } from 'src/entities/area.entity';
import { CreateAreaDTO } from './dto/create-area.dto';
import { AreaResource } from './resources/area.resources';
import { UpdateAreaDTO } from './dto/update-area.dto';

@Injectable()
export class AreaService {
  constructor(
    @InjectRepository(Area)
    private areaRepository: Repository<Area>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createAreaDTO: CreateAreaDTO, user_id?: number, ip?: string) {
    const area = await this.areaRepository.save(
      this.areaRepository.create(createAreaDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Area`,
      ip: ip,
    });

    return area;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.areaRepository.createQueryBuilder('area');

    if (paginationOptions.search) {
      data.andWhere('area.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      AreaResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Area>) {
    const data = await this.areaRepository
      .createQueryBuilder('area')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Area tidak ditemukan',
      );
    }

    return AreaResource(data);
  }

  async findOneFull(fields: EntityCondition<Area>) {
    const data = await this.areaRepository
      .createQueryBuilder('area')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateAreaDto: UpdateAreaDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Area tidak ditemukan',
      );
    }

    await this.areaRepository.update(id, {
      ...updateAreaDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Area`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.areaRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Area`,
      ip: ip,
    });
  }
}
