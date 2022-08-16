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
import { User } from 'src/entities/user.entity';
import { FilesService } from '../files/files.service';
import { BufferedFile } from 'src/utils/file-helper';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    private redisService: RedisService,
    private fileService: FilesService,
  ) {}

  async create(
    createProviderDto: CreateProviderDto,
    photo: BufferedFile,
    user: User,
  ) {
    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, user.id);
      createProviderDto.photo = img;
    }

    const provider = await this.providerRepository.save(
      this.providerRepository.create({
        ...createProviderDto,
      }),
    );

    return this.findOne({ id: provider.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.providerRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.providerRepository.find({
        relations: ['course'],
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
      ProviderResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Provider>) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.provider}:${fields.id}`,
      typeof ProviderResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.providerRepository.findOne({
      relations: ['course'],
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyedia tidak ditemukan',
      );
    }

    this.redisService.set(`${RedisKeyEnum.provider}:${fields.id}`, data);

    return ProviderResource(data);
  }

  async update(
    updateProfileDto: UpdateProviderDto,
    photo: BufferedFile,
    user: User,
  ) {
    const exists = await this.findOne({ id: updateProfileDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyedia tidak ditemukan',
      );
    }

    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, user.id);
      updateProfileDto.photo = img;
    }

    await this.providerRepository.update(updateProfileDto.id, {
      ...updateProfileDto,
    });

    this.redisService.del(`${RedisKeyEnum.provider}:${updateProfileDto.id}`);

    return await this.findOne({ id: updateProfileDto.id });
  }

  async softDelete(id: number): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.provider}:${id}`);
    await this.providerRepository.softDelete(id);
  }
}
