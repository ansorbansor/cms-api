import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { EmployeeUnitResource } from './resources/employee-unit.resources';

@Injectable()
export class EmployeeUnitService {
  constructor(
    @InjectRepository(EmployeeUnit)
    private employeeUnitRepository: Repository<EmployeeUnit>,
  ) {}

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.employeeUnitRepository.count();
    paginationOptions.total = total;

    const getData = await this.employeeUnitRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        name: 'DESC',
      },
    });

    return infinityPagination(getData, EmployeeUnitResource, paginationOptions);
  }
}
