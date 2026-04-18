import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Transportation } from 'src/entities/transportation.entity';
import { TransportationResource } from './resources/transportation.resources';
import { CreateTransportationDto } from './dto/create-transportation.dto';

@Injectable()
export class TransportationService {
  constructor(
    @InjectRepository(Transportation)
    private transportationRepository: Repository<Transportation>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createDto: CreateTransportationDto): Promise<Transportation> {
    const data = this.transportationRepository.create(createDto);
    return await this.transportationRepository.save(data);
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data =
      this.transportationRepository.createQueryBuilder('transportation');

    if (paginationOptions.search) {
      data.andWhere('transportation.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('transportation.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      TransportationResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Transportation>) {
    const data = await this.transportationRepository
      .createQueryBuilder('transportation')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Transportation tidak ditemukan',
      );
    }

    return TransportationResource(data);
  }

  async findOneFull(fields: EntityCondition<Transportation>) {
    const data = await this.transportationRepository
      .createQueryBuilder('transportation')
      .where(fields)
      .getOne();

    return data;
  }
}
