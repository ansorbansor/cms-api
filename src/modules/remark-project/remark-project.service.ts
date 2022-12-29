import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { RemarkProject } from 'src/entities/remark-project.entity';
import { CreateRemarkProjectDTO } from './dto/create-remark-project.dto';
import { RemarkProjectResource } from './resources/remark-project.resources';
import { UpdateRemarkProjectDTO } from './dto/update-remark-project.dto';

@Injectable()
export class RemarkProjectService {
  constructor(
    @InjectRepository(RemarkProject)
    private remarkProjectRepository: Repository<RemarkProject>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createRemarkProjectDTO: CreateRemarkProjectDTO,
    user_id?: number,
    ip?: string,
  ) {
    const remarkProject = await this.remarkProjectRepository.save(
      this.remarkProjectRepository.create(createRemarkProjectDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Remark Project`,
      ip: ip,
    });

    return remarkProject;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data =
      this.remarkProjectRepository.createQueryBuilder('remarkProject');

    if (paginationOptions.search) {
      data.andWhere('remarkProject.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      RemarkProjectResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<RemarkProject>) {
    const data = await this.remarkProjectRepository
      .createQueryBuilder('remarkProject')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Remark Project tidak ditemukan',
      );
    }

    return RemarkProjectResource(data);
  }

  async findOneFull(fields: EntityCondition<RemarkProject>) {
    const data = await this.remarkProjectRepository
      .createQueryBuilder('remarkProject')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateRemarkProjectDto: UpdateRemarkProjectDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Remark Project tidak ditemukan',
      );
    }

    await this.remarkProjectRepository.update(id, {
      ...updateRemarkProjectDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Remark Project`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.remarkProjectRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Remark Project`,
      ip: ip,
    });
  }
}
