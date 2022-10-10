import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ForgotPassword } from 'src/entities/forgot-password.entity';
import { FindOptions } from 'src/utils/types';
import { DeepPartial, Repository } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class ForgotPasswordService {
  constructor(
    @InjectRepository(ForgotPassword)
    private forgotRepository: Repository<ForgotPassword>,
    private activityLogService: ActivityLogService,
  ) {}

  async findOne(options: FindOptions<ForgotPassword>) {
    return this.forgotRepository.findOne({
      where: options.where,
    });
  }

  async findManyWithPagination(options: FindOptions<ForgotPassword>) {
    return this.forgotRepository.find({
      where: options.where,
    });
  }

  async create(data: DeepPartial<ForgotPassword>) {
    await this.activityLogService.create({
      user_id: data.userData.id,
      description: 'Lupa Password',
      ip: data.ip,
    });
    return this.forgotRepository.save(this.forgotRepository.create(data));
  }

  async softDelete(id: number): Promise<void> {
    await this.forgotRepository.softDelete(id);
  }
}
