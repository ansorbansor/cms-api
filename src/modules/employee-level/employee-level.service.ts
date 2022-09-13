import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
import { EmployeeLevelResource } from './resources/employee-level.resources';

@Injectable()
export class EmployeeLevelService {
  constructor(
    @InjectRepository(EmployeeLevel)
    private employeeLevelRepository: Repository<EmployeeLevel>,
  ) {}

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.employeeLevelRepository.count();
    paginationOptions.total = total;

    const getData = await this.employeeLevelRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        name: 'DESC',
      },
    });

    return infinityPagination(
      getData,
      EmployeeLevelResource,
      paginationOptions,
    );
  }
}
