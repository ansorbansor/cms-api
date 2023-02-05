import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreatePurchaseOrderDTO } from './dto/create-po.dto';
import {
  PurchaseOrderDetailResource,
  PurchaseOrderResource,
} from './resources/purchase-order.resources';
import { User } from 'src/entities/user.entity';
import { UpdatePurchaseOrderDTO } from './dto/update-po.dto';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderInvoice)
    private purchaseOrderInvoiceRepository: Repository<PurchaseOrderInvoice>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createPurchaseOrderDTO: CreatePurchaseOrderDTO,
    user_id?: number,
    ip?: string,
  ) {
    const po = await this.purchaseOrdersRepository.save(
      this.purchaseOrdersRepository.create({
        user_id: user_id,
        ...createPurchaseOrderDTO,
      }),
    );

    if (createPurchaseOrderDTO.invoices) {
      const saveInvoice = createPurchaseOrderDTO.invoices;
      for (const data of saveInvoice) {
        data['user_id'] = user_id;
        data['purchase_order_id'] = po.id;
      }

      await this.purchaseOrderInvoiceRepository.save(saveInvoice);
    }

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah PO`,
      ip: ip,
    });

    return po;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.purchaseOrdersRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.project', 'project')
      .leftJoinAndSelect('po.region', 'region');

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(`LOWER(po.cc) LIKE :search`, {
            search: `%${paginationOptions.search.toLowerCase()}%`,
          }).orWhere(`LOWER(po.po_number) LIKE :search`, {
            search: `%${paginationOptions.search.toLowerCase()}%`,
          });
        }),
      );
    }

    data.orderBy('po.created_at', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = 50;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      PurchaseOrderResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<PurchaseOrder>) {
    const data = await this.purchaseOrdersRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.region', 'region')
      .leftJoinAndSelect('po.area', 'area')
      .leftJoinAndSelect('po.customer', 'customer')
      .leftJoinAndSelect('po.operator', 'operator')
      .leftJoinAndSelect('po.project', 'project')
      .leftJoinAndSelect('po.site', 'site')
      .leftJoinAndSelect('po.bidding_area', 'bidding_area')
      .leftJoinAndSelect('po.remark_project', 'remark_project')
      .leftJoinAndSelect('po.status_acceptance', 'status_acceptance')
      .leftJoinAndSelect('po.pending_type', 'pending_type')
      .leftJoinAndSelect('po.pd', 'pd')
      .leftJoinAndSelect('po.po_invoice', 'po_invoice')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PO tidak ditemukan',
      );
    }

    return PurchaseOrderDetailResource(data);
  }

  async findOneFull(fields: EntityCondition<PurchaseOrder>) {
    const data = await this.purchaseOrdersRepository
      .createQueryBuilder('po')
      .where(fields)
      .getOne();

    return data;
  }

  async update(
    id: number,
    updatePurchaseOrderDto: UpdatePurchaseOrderDTO,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PO tidak ditemukan',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { invoices, deleted_invoice_id, ...updatedDataPO } =
      updatePurchaseOrderDto;

    await this.purchaseOrdersRepository.update(id, {
      ...updatedDataPO,
    });

    if (updatePurchaseOrderDto.invoices) {
      for (const inv of updatePurchaseOrderDto.invoices) {
        await this.purchaseOrderInvoiceRepository.update(inv.id, inv);
      }
    }

    if (
      updatePurchaseOrderDto.deleted_invoice_id &&
      updatePurchaseOrderDto.deleted_invoice_id.length > 0
    ) {
      for (const del of updatePurchaseOrderDto.deleted_invoice_id) {
        await this.purchaseOrderInvoiceRepository.softDelete(del);
      }
    }

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data PO`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.purchaseOrdersRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data PO`,
      ip: ip,
    });
  }
}
