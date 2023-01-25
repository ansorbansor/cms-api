import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { PendingType } from 'src/entities/pending-type.entity';
import { CreatePendingTypeDTO } from './dto/create-pending-type.dto';
import { PendingTypeResource } from './resources/pending-type.resources';
import { UpdatePendingTypeDTO } from './dto/update-pending-type.dto';

@Injectable()
export class PendingTypeService {
  constructor(
    @InjectRepository(PendingType)
    private pendingTypeRepository: Repository<PendingType>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createPendingTypeDTO: CreatePendingTypeDTO,
    user_id?: number,
    ip?: string,
  ) {
    const pendingType = await this.pendingTypeRepository.save(
      this.pendingTypeRepository.create(createPendingTypeDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Pending Type`,
      ip: ip,
    });

    return pendingType;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.pendingTypeRepository.createQueryBuilder('pendingType');

    if (paginationOptions.search) {
      data.andWhere('pendingType.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('pendingType.name', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      PendingTypeResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<PendingType>) {
    const data = await this.pendingTypeRepository
      .createQueryBuilder('pendingType')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pending Type tidak ditemukan',
      );
    }

    return PendingTypeResource(data);
  }

  async findOneFull(fields: EntityCondition<PendingType>) {
    const data = await this.pendingTypeRepository
      .createQueryBuilder('pendingType')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updatePendingTypeDto: UpdatePendingTypeDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pending Type tidak ditemukan',
      );
    }

    await this.pendingTypeRepository.update(id, {
      ...updatePendingTypeDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Pending Type`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.pendingTypeRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Pending Type`,
      ip: ip,
    });
  }
}
