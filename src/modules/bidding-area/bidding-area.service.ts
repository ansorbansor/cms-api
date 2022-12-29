import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { BiddingArea } from 'src/entities/bidding_area.entity';
import { CreateBiddingAreaDTO } from './dto/create-bidding-area.dto';
import { BiddingAreaResource } from './resources/bidding-area.resources';
import { UpdateBiddingAreaDTO } from './dto/update-bidding-area.dto';

@Injectable()
export class BiddingAreaService {
  constructor(
    @InjectRepository(BiddingArea)
    private biddingAreaRepository: Repository<BiddingArea>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createBiddingAreaDTO: CreateBiddingAreaDTO,
    user_id?: number,
    ip?: string,
  ) {
    const biddingArea = await this.biddingAreaRepository.save(
      this.biddingAreaRepository.create(createBiddingAreaDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Bidding Area`,
      ip: ip,
    });

    return biddingArea;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.biddingAreaRepository.createQueryBuilder('biddingArea');

    if (paginationOptions.search) {
      data.andWhere('biddingArea.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      BiddingAreaResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<BiddingArea>) {
    const data = await this.biddingAreaRepository
      .createQueryBuilder('biddingArea')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Bidding Area tidak ditemukan',
      );
    }

    return BiddingAreaResource(data);
  }

  async findOneFull(fields: EntityCondition<BiddingArea>) {
    const data = await this.biddingAreaRepository
      .createQueryBuilder('biddingArea')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateBiddingAreaDto: UpdateBiddingAreaDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Bidding Area tidak ditemukan',
      );
    }

    await this.biddingAreaRepository.update(id, {
      ...updateBiddingAreaDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Bidding Area`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.biddingAreaRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Bidding Area`,
      ip: ip,
    });
  }
}
