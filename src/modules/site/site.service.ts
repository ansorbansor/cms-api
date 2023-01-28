import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { Site } from 'src/entities/site.entity';
import { CreateSiteDTO } from './dto/create-site.dto';
import { SiteResource } from './resources/site.resources';
import { UpdateSiteDTO } from './dto/update-site.dto';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { PurchaseOrderBySiteResource } from '../purchase-orders/resources/purchase-order.resources';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(PurchaseOrder)
    private poRepository: Repository<PurchaseOrder>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createSiteDTO: CreateSiteDTO, user_id?: number, ip?: string) {
    const site = await this.siteRepository.save(
      this.siteRepository.create(createSiteDTO),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Site`,
      ip: ip,
    });

    return site;
  }

  async getPOBySite(siteId: number) {
    const po = await this.poRepository.find({ where: { site_id: siteId } });

    return infinityPagination(po, PurchaseOrderBySiteResource, null);
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.siteRepository.createQueryBuilder('site');

    if (paginationOptions.search) {
      data.andWhere('site.code ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('site.code', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      SiteResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<Site>) {
    const data = await this.siteRepository
      .createQueryBuilder('site')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Site tidak ditemukan',
      );
    }

    return SiteResource(data);
  }

  async findOneFull(fields: EntityCondition<Site>) {
    const data = await this.siteRepository
      .createQueryBuilder('site')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updateSiteDto: UpdateSiteDTO,
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

    await this.siteRepository.update(id, {
      ...updateSiteDto,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Site`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.siteRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Site`,
      ip: ip,
    });
  }
}
