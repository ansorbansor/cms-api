import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { Coupon } from 'src/entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponResource } from './resources/coupon.resources';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createCouponDto: CreateCouponDto, user: User, ip: string) {
    const coupon = await this.couponRepository.save(
      this.couponRepository.create({
        ...createCouponDto,
      }),
    );

    await this.activityLogService.create({
      user_id: user.id,
      description: `Tambah Kupon ${createCouponDto.name}`,
      ip: ip,
    });

    return this.findOne({ id: coupon.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.provider', 'provider')
      .leftJoinAndSelect('coupon.course', 'course')
      .leftJoinAndSelect('provider.photoFile', 'photoFile');

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(
            `LOWER(coupon.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          )
            .orWhere(
              `LOWER(coupon.code) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
            )
            .orWhere(
              `coupon.amount LIKE '%${paginationOptions.search.toLowerCase()}%'`,
            );
        }),
      );
    }

    if (paginationOptions.start_date) {
      data.andWhere(`coupon.start_date >= '${paginationOptions.start_date}'`);
    }

    if (paginationOptions.end_date) {
      data.andWhere(`coupon.end_date <= '${paginationOptions.end_date}'`);
    }

    if (paginationOptions.provider_id) {
      data.andWhere(`provider.id = ${paginationOptions.provider_id}`);
    }

    if (
      paginationOptions.status_string != undefined &&
      paginationOptions.status_string != ''
    ) {
      data.andWhere(`coupon.status = ${paginationOptions.status_string}`);
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);
    data.orderBy('coupon.id', 'DESC');

    const getData = await data.getMany();

    return infinityPagination(getData, CouponResource, paginationOptions);
  }

  async findOne(fields: EntityCondition<Coupon>) {
    const data = await this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.provider', 'provider')
      .leftJoinAndSelect('coupon.course', 'course')
      .leftJoinAndSelect('provider.photoFile', 'photoFile')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kupon tidak ditemukan',
      );
    }

    return CouponResource(data);
  }

  async update(updateCouponDto: UpdateCouponDto, user: User, ip: string) {
    const exists = await this.findOne({ id: updateCouponDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kupon tidak ditemukan',
      );
    }

    await this.couponRepository.update(updateCouponDto.id, {
      ...updateCouponDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Kupon ${updateCouponDto.name}`,
      ip: ip,
    });

    return await this.findOne({ id: updateCouponDto.id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    const deletedData = await this.couponRepository.findOne({ id: id });

    await this.couponRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Kupon ${deletedData.name}`,
      ip: ip,
    });
  }
}
