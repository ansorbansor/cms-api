import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { RedisKeyEnum } from 'src/utils/enums';
import { Provider } from 'src/entities/provider.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { ProviderResource } from './resources/provider.resources';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,

    private redisService: RedisService,
  ) {}

  async create(createProviderDto: CreateProviderDto) {
    const user = await this.providerRepository.save(
      this.providerRepository.create(createProviderDto),
    );

    return this.findOne({ id: user.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.providerRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.providerRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      ProviderResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Provider>) {
    const data = await this.providerRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyedia tidak ditemukan',
      );
    }

    return ProviderResource(data);
  }

  async update(id: number, updateProfileDto: UpdateProviderDto) {
    const exists = await this.findOne({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyedia tidak ditemukan',
      );
    }

    await this.providerRepository.update(id, {
      ...updateProfileDto,
    });

    this.redisService.del(`${RedisKeyEnum.user}${id}`);

    return await this.findOne({ id: id });
  }

  async softDelete(id: number): Promise<void> {
    await this.providerRepository.softDelete(id);
  }
}
