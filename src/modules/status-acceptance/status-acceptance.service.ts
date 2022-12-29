import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { StatusAcceptance } from 'src/entities/status-acceptance.entity';
import { CreateStatusAcceptanceDTO } from './dto/create-status-acceptance.dto';
import { StatusAcceptanceResource } from './resources/status-acceptance.resources';
import { UpdateStatusAcceptanceDTO } from './dto/update-status-acceptance.dto';

@Injectable()
export class StatusAcceptanceService {
  constructor(
    @InjectRepository(StatusAcceptance)
    private statusAcceptanceRepository: Repository<StatusAcceptance>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createStatusAcceptanceDTO: CreateStatusAcceptanceDTO,
    user_id?: number,
    ip?: string,
  ) {
    const statusAcceptance = await this.statusAcceptanceRepository.save(
      this.statusAcceptanceRepository.create(createStatusAcceptanceDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Status Acceptance`,
      ip: ip,
    });

    return statusAcceptance;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data =
      this.statusAcceptanceRepository.createQueryBuilder('statusAcceptance');

    if (paginationOptions.search) {
      data.andWhere('statusAcceptance.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      StatusAcceptanceResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<StatusAcceptance>) {
    const data = await this.statusAcceptanceRepository
      .createQueryBuilder('statusAcceptance')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Status Acceptance tidak ditemukan',
      );
    }

    return StatusAcceptanceResource(data);
  }

  async findOneFull(fields: EntityCondition<StatusAcceptance>) {
    const data = await this.statusAcceptanceRepository
      .createQueryBuilder('statusAcceptance')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateStatusAcceptanceDto: UpdateStatusAcceptanceDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Status Acceptance tidak ditemukan',
      );
    }

    await this.statusAcceptanceRepository.update(id, {
      ...updateStatusAcceptanceDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Status Acceptance`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.statusAcceptanceRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Status Acceptance`,
      ip: ip,
    });
  }
}
