import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLog } from 'src/entities/activity-log.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { ActivityLogResource } from './resources/activity-log.resources';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(createActivityLogDto: CreateActivityLogDto) {
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        ...createActivityLogDto,
      }),
    );
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.activityLogRepository
      .createQueryBuilder('acl')
      .leftJoinAndSelect('acl.user', 'user')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition');

    data.orderBy('acl.created_at', 'DESC');

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(`LOWER(acl.description) LIKE :search`, {
            search: `%${paginationOptions.search.toLowerCase()}%`,
          })
            .orWhere(`LOWER(user.name) LIKE :search`, {
              search: `%${paginationOptions.search.toLowerCase()}%`,
            })
            .orWhere(`LOWER(acl.ip) LIKE :search`, {
              search: `%${paginationOptions.search.toLowerCase()}%`,
            });
        }),
      );
    }

    if (paginationOptions.start_date && paginationOptions.end_date) {
      data.andWhere(`acl.created_at >= :start_date`, {
        start_date: `${paginationOptions.start_date}`,
      });
      data.andWhere(`acl.created_at <= :end_date`, {
        end_date: `${paginationOptions.end_date}`,
      });
    }

    if (paginationOptions.role && paginationOptions.role.length > 0) {
      data.andWhere(`role.id IN (:role)`, {
        role: paginationOptions.role,
      });
    }

    data.orderBy('acl.id', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      ActivityLogResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<ActivityLog>) {
    const data = await this.activityLogRepository.findOne({
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Activity log tidak ditemukan',
      );
    }

    return ActivityLogResource(data);
  }
}
