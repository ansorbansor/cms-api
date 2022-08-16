import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
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
    const total = await this.activityLogRepository.count();
    paginationOptions.total = total;

    return infinityPagination(
      await this.activityLogRepository.find({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      }),
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
