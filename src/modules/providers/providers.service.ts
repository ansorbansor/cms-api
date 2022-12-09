import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { ErrorMessage, FilePath, RedisKeyEnum } from 'src/utils/enums';
import { Provider } from 'src/entities/provider.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { ProviderResource } from './resources/provider.resources';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { User } from 'src/entities/user.entity';
import { FilesService } from '../files/files.service';
import { BufferedFile } from 'src/utils/file-helper';
import { MailService } from '../mail/mail.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Course } from 'src/entities/course.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
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
      const img = await this.fileService.uploadWithMinio(
        photo,
        user.id,
        FilePath.PROVIDER,
        'Provider Thumbnail',
      );
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
      .leftJoinAndSelect('provider.photoFile', 'photoFile');

    if (paginationOptions.search) {
      data.andWhere(`LOWER(provider.name) LIKE :search`, {
        search: `%${paginationOptions.search.toLowerCase()}%`,
      });
    }

    const total = await this.providerRepository.count();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);
    const result = await data.getMany();

    const providerId = result.map((e) => {
      return e.id;
    });

    const courseCount = await getManager().query(
      `SELECT COUNT(id) as total, provider_id FROM courses WHERE status = 1 AND deleted_at IS NULL${
        providerId.length > 0 ? ` AND provider_id IN (${providerId})` : ''
      } GROUP BY provider_id`,
    );

    return infinityPagination(
      result,
      ProviderResource,
      paginationOptions,
      courseCount,
    );
  }

  async findOne(fields: EntityCondition<Provider>) {
    if (Number.isNaN(fields.id)) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        ErrorMessage.DATA_TYPE_NOT_EXPECTED,
      );
    }

    const value = await this.redisService.get(
      `${RedisKeyEnum.provider}:${fields.id}`,
      typeof ProviderResource,
    );
    if (value != null) {
      return value;
    }

    const data = await this.providerRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyelenggara tidak ditemukan',
      );
    }

    const courseCount = await getManager().query(
      `SELECT COUNT(id) as total, provider_id FROM courses WHERE status = 1 AND deleted_at IS NULL AND provider_id = ${fields.id} GROUP BY provider_id`,
    );

    this.redisService.set(
      `${RedisKeyEnum.provider}:${fields.id}`,
      ProviderResource(data, null, courseCount),
    );

    return ProviderResource(data, null, courseCount);
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
      const img = await this.fileService.uploadWithMinio(
        photo,
        user.id,
        FilePath.PROVIDER,
        'Provider Thumbnail',
      );
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

  async activateFetchProvider(providerId: string) {
    const exists = await this.findOne({ id: providerId });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Penyelenggara tidak ditemukan',
      );
    }

    await this.providerRepository.update(providerId, {
      fetch_data: !exists.fetch_data,
    });
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
        ErrorMessage.EMAIL_NOT_EXISTS,
      );
    }

    await this.mailService.registerProvider({
      to: user.email,
      data: {
        providerName: provider.name,
        providerUrl: provider.url,
        tutorialUrl: provider.tutorial_url,
      },
    });
  }
}
