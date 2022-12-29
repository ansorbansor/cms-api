import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Customer } from 'src/entities/customer.entity';
import { CreateCustomerDTO } from './dto/create-customer.dto';
import { CustomerResource } from './resources/customer.resources';
import { UpdateCustomerDTO } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createCustomerDTO: CreateCustomerDTO,
    user_id?: number,
    ip?: string,
  ) {
    const customer = await this.customerRepository.save(
      this.customerRepository.create(createCustomerDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Customer`,
      ip: ip,
    });

    return customer;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.customerRepository.createQueryBuilder('customer');

    if (paginationOptions.search) {
      data.andWhere('customer.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      CustomerResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Customer>) {
    const data = await this.customerRepository
      .createQueryBuilder('customer')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Customer tidak ditemukan',
      );
    }

    return CustomerResource(data);
  }

  async findOneFull(fields: EntityCondition<Customer>) {
    const data = await this.customerRepository
      .createQueryBuilder('customer')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Customer tidak ditemukan',
      );
    }

    await this.customerRepository.update(id, {
      ...updateCustomerDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Customer`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.customerRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Customer`,
      ip: ip,
    });
  }
}
