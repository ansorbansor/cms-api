import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import { SPKOperationalRequestTypeResource } from './resources/spk-operational-request-type.resources';
import { SPKOperationalRequestType } from 'src/entities/spk-operational-request-type.entity';

@Injectable()
export class SPKOperationalRequestTypeService {
  constructor(
    @InjectRepository(SPKOperationalRequestType)
    private spkOperationalRequestTypeRepository: Repository<SPKOperationalRequestType>,
  ) {}

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.spkOperationalRequestTypeRepository.count();
    paginationOptions.total = total;

    const getData = await this.spkOperationalRequestTypeRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        name: 'DESC',
      },
    });

    return infinityPagination(
      getData,
      SPKOperationalRequestTypeResource,
      paginationOptions,
    );
  }
}
