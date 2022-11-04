import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import { PKASNProgram } from 'src/entities/pkasn-program.entity';
import { PKASNProgramResource } from './resource/pkasn-program.resources';

@Injectable()
export class PKASNProgramService {
  constructor(
    @InjectRepository(PKASNProgram)
    private pkasnProgramRepository: Repository<PKASNProgram>,
  ) {}

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.pkasnProgramRepository.count();
    paginationOptions.total = total;

    const getData = await this.pkasnProgramRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        name: 'DESC',
      },
    });

    return infinityPagination(getData, PKASNProgramResource, paginationOptions);
  }
}
