import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Operator } from 'src/entities/operator.entity';
import { CreateOperatorDTO } from './dto/create-operator.dto';
import { OperatorResource } from './resources/operator.resources';
import { UpdateOperatorDTO } from './dto/update-operator.dto';

@Injectable()
export class OperatorService {
  constructor(
    @InjectRepository(Operator)
    private operatorRepository: Repository<Operator>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createOperatorDTO: CreateOperatorDTO,
    user_id?: number,
    ip?: string,
  ) {
    const area = await this.operatorRepository.save(
      this.operatorRepository.create(createOperatorDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Operator`,
      ip: ip,
    });

    return area;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.operatorRepository.createQueryBuilder('operator');

    if (paginationOptions.search) {
      data.andWhere('operator.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('operator.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      OperatorResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Operator>) {
    const data = await this.operatorRepository
      .createQueryBuilder('operator')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Operator tidak ditemukan',
      );
    }

    return OperatorResource(data);
  }

  async findOneFull(fields: EntityCondition<Operator>) {
    const data = await this.operatorRepository
      .createQueryBuilder('operator')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateOperatorDto: UpdateOperatorDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Operator tidak ditemukan',
      );
    }

    await this.operatorRepository.update(id, {
      ...updateOperatorDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Operator`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.operatorRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Operator`,
      ip: ip,
    });
  }
}
