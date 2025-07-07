import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Project } from 'src/entities/project.entity';
import { CreateProjectDTO } from './dto/create-project.dto';
import { ProjectResource } from './resources/project.resources';
import { UpdateProjectDTO } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createProjectDTO: CreateProjectDTO,
    user_id?: number,
    ip?: string,
  ) {
    const project = await this.projectRepository.save(
      this.projectRepository.create(createProjectDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Project`,
      ip: ip,
    });

    return project;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.projectRepository.createQueryBuilder('project');

    if (paginationOptions.search) {
      data.andWhere('project.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('project.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      ProjectResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Project>) {
    const data = await this.projectRepository
      .createQueryBuilder('project')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Project tidak ditemukan',
      );
    }

    return ProjectResource(data);
  }

  async findOneFull(fields: EntityCondition<Project>) {
    const data = await this.projectRepository
      .createQueryBuilder('project')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Site tidak ditemukan',
      );
    }

    await this.projectRepository.update(id, {
      ...updateProjectDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Project`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.projectRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Project`,
      ip: ip,
    });
  }
}
