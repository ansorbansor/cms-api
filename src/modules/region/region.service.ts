import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Region } from 'src/entities/region.entity';
import { CreateRegionDTO } from './dto/create-region.dto';
import { RegionResource } from './resources/region.resources';
import { UpdateRegionDTO } from './dto/update-region.dto';

@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(Region)
    private regionRepository: Repository<Region>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createRegionDTO: CreateRegionDTO,
    user_id?: number,
    ip?: string,
  ) {
    const area = await this.regionRepository.save(
      this.regionRepository.create(createRegionDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Region`,
      ip: ip,
    });

    return area;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.regionRepository.createQueryBuilder('region');

    if (paginationOptions.search) {
      data.andWhere('region.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('region.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      RegionResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Region>) {
    const data = await this.regionRepository
      .createQueryBuilder('region')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Region tidak ditemukan',
      );
    }

    return RegionResource(data);
  }

  async findOneFull(fields: EntityCondition<Region>) {
    const data = await this.regionRepository
      .createQueryBuilder('region')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateRegionDto: UpdateRegionDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Region tidak ditemukan',
      );
    }

    await this.regionRepository.update(id, {
      ...updateRegionDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Region`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.regionRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Region`,
      ip: ip,
    });
  }
}
