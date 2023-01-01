import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) {}
}
