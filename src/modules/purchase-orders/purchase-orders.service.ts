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
import moment from 'moment';
import { exportUniqueId } from 'src/utils/encryption-helper';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderInvoice)
    private purchaseOrderInvoiceRepository: Repository<PurchaseOrderInvoice>,
    private activityLogService: ActivityLogService,
  ) { }

  async create(
    createPurchaseOrderDTO: CreatePurchaseOrderDTO,
    user_id?: number,
    ip?: string,
  ) {
    if (createPurchaseOrderDTO.invoices.length > 0) {
      let totalAcceptance = 0;
      createPurchaseOrderDTO.invoices.forEach((inv) => {
        totalAcceptance +=
          inv.submit_date != null &&
            moment(new Date(inv.submit_date)).format('YYYY-MM-D') !=
            'Invalid date'
            ? Number(createPurchaseOrderDTO.unit_price_1)
            : 0;
      });

      createPurchaseOrderDTO['total_acceptance'] = totalAcceptance;
    }

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
      description: `Menambahkan data PO dengan nomor ${exportUniqueId(
        po.id,
        po.createdAtParseDate,
      )}`,
      ip: ip,
    });

    return po;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.purchaseOrdersRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.project', 'project')
      .leftJoinAndSelect('po.region', 'region')
      .leftJoinAndSelect('po.site', 'site');

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(`LOWER(po.cc) LIKE :search`, {
            search: `%${paginationOptions.search.toLowerCase()}%`,
          })
            .orWhere(`LOWER(po.po_number) LIKE :search`, {
              search: `%${paginationOptions.search.toLowerCase()}%`,
            })
            .orWhere(`LOWER(site.code) LIKE :search`, {
              search: `%${paginationOptions.search.toLowerCase()}%`,
            });
        }),
      );
    }

    if (paginationOptions.start_date) {
      data.andWhere('po.created_at >= :start_date', {
        start_date: `%${paginationOptions.start_date}%`,
      });
    }

    if (paginationOptions.end_date) {
      data.andWhere('po.created_at <= :end_date', {
        end_date: `%${paginationOptions.end_date}%`,
      });
    }

    if (paginationOptions.status_string) {
      data.andWhere('LOWER(po.status) = :status', {
        status: paginationOptions.status_string,
      });
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
      .leftJoinAndSelect('po.pic_data', 'pic_data')
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

    const insertedInvoice = [];

    if (updatePurchaseOrderDto.invoices) {
      for (const inv of updatePurchaseOrderDto.invoices) {
        if (inv.id) {
          await this.purchaseOrderInvoiceRepository.update(inv.id, inv);
        } else {
          insertedInvoice.push({
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            invoice_status: inv.invoice_status,
            payment_date: inv.payment_date,
            supplier_tax_number: inv.supplier_tax_number,
            supplier_tax_date: inv.supplier_tax_date,
            payment_amount: inv.payment_amount,
            deduction_amount: inv.deduction_amount,
            purchase_order_id: id,
            user_id: user.id,
            submit_date: inv.submit_date,
            approve_date: inv.approve_date,
            submit_amount: inv.submit_amount,
            approve_amount: inv.approve_amount,
          });
        }
      }
    }

    if (insertedInvoice.length > 0) {
      await this.purchaseOrderInvoiceRepository.insert(insertedInvoice);
    }

    if (
      updatePurchaseOrderDto.deleted_invoice_id &&
      updatePurchaseOrderDto.deleted_invoice_id.length > 0
    ) {
      for (const del of updatePurchaseOrderDto.deleted_invoice_id) {
        await this.purchaseOrderInvoiceRepository.softDelete(del);
      }
    }

    const po = await this.findOne({ id: id });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Mengupdate Data PO dengan nomor ${exportUniqueId(
        po.id,
        po.createdAtParseDate,
      )}`,
      ip: ip,
    });

    return po;
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    const po = await this.findOne({ id: id });

    if (po) {
      await this.purchaseOrdersRepository.softDelete(id);

      await this.activityLogService.create({
        user_id: user.id,
        description: `Menghapus Data PO dengan nomor ${exportUniqueId(
          po.id,
          po.createdAtParseDate,
        )}`,
        ip: ip,
      });
    }
  }
}
