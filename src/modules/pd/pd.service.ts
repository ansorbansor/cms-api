import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { PD } from 'src/entities/pd.entity';
import { CreatePDDTO } from './dto/create-pd.dto';
import { PDResource } from './resources/pd.resources';
import { UpdatePDDTO } from './dto/update-pd.dto';

@Injectable()
export class PDService {
  constructor(
    @InjectRepository(PD)
    private pdRepository: Repository<PD>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createPDDTO: CreatePDDTO, user_id?: number, ip?: string) {
    const pd = await this.pdRepository.save(
      this.pdRepository.create(createPDDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah PD`,
      ip: ip,
    });

    return pd;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.pdRepository.createQueryBuilder('pd');

    if (paginationOptions.search) {
      data.andWhere('pd.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      PDResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<PD>) {
    const data = await this.pdRepository
      .createQueryBuilder('pd')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PD tidak ditemukan',
      );
    }

    return PDResource(data);
  }

  async findOneFull(fields: EntityCondition<PD>) {
    const data = await this.pdRepository
      .createQueryBuilder('pd')
      .where(fields)
      .getOne();

    return data;
  }

  async update(id: number, updatePDDto: UpdatePDDTO, user: User, ip: string) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Customer tidak ditemukan',
      );
    }

    await this.pdRepository.update(id, {
      ...updatePDDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data PD`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.pdRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data PD`,
      ip: ip,
    });
  }
}
