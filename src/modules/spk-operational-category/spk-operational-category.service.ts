import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import { SPKOperationalCategoryResource } from './resources/spk-operational-category.resources';
import { SPKOperationalCategory } from 'src/entities/spk-operational-category.entity';

@Injectable()
export class SPKOperationalCategoryService {
  constructor(
    @InjectRepository(SPKOperationalCategory)
    private spkOperationalCategoryRepository: Repository<SPKOperationalCategory>,
  ) {}

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.spkOperationalCategoryRepository.count();
    paginationOptions.total = total;

    const getData = await this.spkOperationalCategoryRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        name: 'DESC',
      },
    });

    return infinityPagination(
      getData,
      SPKOperationalCategoryResource,
      paginationOptions,
    );
  }
}
