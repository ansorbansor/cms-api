import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { Coupon } from 'src/entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponResource } from './resources/coupon.resources';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const coupon = await this.couponRepository.save(
      this.couponRepository.create({
        ...createCouponDto,
      }),
    );

    return this.findOne({ id: coupon.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = await this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.provider', 'provider')
      .leftJoinAndSelect('coupon.course', 'course')
      .leftJoinAndSelect('provider.photoFile', 'photoFile');

    if (paginationOptions.search) {
      data.andWhere(
        `LOWER(coupon.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
      data.orWhere(
        `LOWER(coupon.code) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
      );
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

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

  async update(updateCouponDto: UpdateCouponDto) {
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

    return await this.findOne({ id: updateCouponDto.id });
  }

  async softDelete(id: number): Promise<void> {
    await this.couponRepository.softDelete(id);
  }
}
