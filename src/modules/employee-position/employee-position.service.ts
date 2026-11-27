import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { EmployeePositionResource } from './resources/employee-position.resources';

@Injectable()
export class EmployeePositionService {
  constructor(
    @InjectRepository(EmployeePosition)
    private employeePositionRepository: Repository<EmployeePosition>,
  ) {}

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.employeePositionRepository.count();
    paginationOptions.total = total;

    const getData = await this.employeePositionRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        name: 'DESC',
      },
    });

    return infinityPagination(
      getData,
      EmployeePositionResource,
      paginationOptions,
    );
  }
}
