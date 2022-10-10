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
import { MailService } from '../mail/mail.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
    private fileService: FilesService,
    private mailService: MailService,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createProviderDto: CreateProviderDto,
    photo: BufferedFile,
    user: User,
    ip: string,
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

    await this.activityLogService.create({
      user_id: user.id,
      description: `Tambah Data Penyelenggara ${createProviderDto.name}`,
      ip: ip,
    });

    return this.findOne({ id: provider.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.providerRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.photoFile', 'photoFile')
      .leftJoinAndSelect('provider.course', 'course');

    if (paginationOptions.search) {
      data.where(
        `LOWER(provider.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
    }

    const total = await this.providerRepository.count();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
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
        'Penyelenggara tidak ditemukan',
      );
    }

    this.redisService.set(
      `${RedisKeyEnum.provider}:${fields.id}`,
      ProviderResource(data),
    );

    return ProviderResource(data);
  }

  async update(
    updateProfileDto: UpdateProviderDto,
    photo: BufferedFile,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOne({ id: updateProfileDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyelenggara tidak ditemukan',
      );
    }

    if (photo) {
      const img = await this.fileService.uploadWithMinio(photo, user.id);
      updateProfileDto.photo = img;
    }

    await this.providerRepository.update(updateProfileDto.id, {
      ...updateProfileDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Penyelenggara ${updateProfileDto.name}`,
      ip: ip,
    });

    this.redisService.del(`${RedisKeyEnum.provider}:${updateProfileDto.id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);

    return await this.findOne({ id: updateProfileDto.id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.provider}:${id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);

    const deletedData = await this.providerRepository.findOne({ id: id });

    await this.providerRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Penyelenggara ${deletedData.name}`,
      ip: ip,
    });
  }

  async sendMailRegisterProvider(providerId: number, userId: number) {
    const provider = await this.providerRepository.findOne({ id: providerId });
    if (!provider) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyelenggara tidak ditemukan',
      );
    }

    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Pengguna tidak ditemukan',
      );
    }

    await this.mailService.registerProvider({
      to: user.email,
      data: {
        providerName: provider.name,
        providerUrl: provider.url,
        downloadUrl: 'https://google.com',
      },
    });
  }
}
