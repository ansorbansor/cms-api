import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
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
    const po = await this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.project', 'project')
      .where('site_id = :siteId', {
        siteId: siteId,
      })
      .getMany();

    let maxBudgetBySite = await getManager().query(
      "SELECT SUM(unit_price * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
      [siteId],
    );

    maxBudgetBySite = maxBudgetBySite[0].sum
      ? Math.round(Number(maxBudgetBySite[0].sum))
      : 0;

    let totalSPKAmount = await getManager().query(
      'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [siteId],
    );
    totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    let totalCashback = await getManager().query(
      'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [siteId],
    );
    totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    let totalCashout = await getManager().query(
      'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [siteId],
    );
    totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    return PurchaseOrderBySiteResource(po, totalSPKAmount, maxBudgetBySite);
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
