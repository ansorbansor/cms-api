import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { Site } from 'src/entities/site.entity';
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
import { WorkloadTicketPoHistory } from 'src/entities/workload-ticket-po-history.entity';
import { POCustomColumn } from 'src/entities/po-custom-column.entity';
import { CreatePOColumnDTO } from './dto/create-po-column.dto';

export const PROTECTED_PO_COLUMNS = new Set([
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'user_id',
  'cc',
  'line_po_status',
  'line_po_number',
  'po_number',
  'shipment_number',
  'region_id',
  'area_id',
  'operator_id',
  'customer_id',
  'project_id',
  'site_id',
  'workload_ticket_id',
  'status',
  'item_code',
  'item_description',
  'unit_price',
  'unit_price_1',
  'unit_price_2',
  'requested_qty',
  'billed_qty',
  'due_qty',
  'line_amount',
  'remaining_from_po',
  'unit',
  'payment_terms',
  'bidding_area_id',
  'publish_date',
  'start_date',
  'end_date',
  'priority_esar_approve',
  'remark_weekly',
  'remark_project_id',
  'status_acceptance_id',
  'pending_type_id',
  'pending_approval_pd',
  'amount_pending_approval_pd',
  'pd_id',
  'actual_completion_date',
  'ready_invoice',
  'amount_ready_invoice',
  'remark_highlight',
  'budget_percentage',
  'unique_id',
  'total_acceptance',
  'ny_invoice',
  'ny_invoice_date',
  'piutang',
  'priority_site_list',
  'amount_priority',
  'achievement_priority',
  'actual_work_date',
  'actual_work_amount',
  'actual_work_status',
  'remark_highlight_recon',
  'pic',
  'plan_date',
  'done_atp',
  'start_progress',
  'finish_progress',
  'remark_ss',
  'start_progress_confirmed_by_rpm',
  'finish_progress_confirmed_by_rpm',
  'done_atp_confirmed_by_rpm',
  'remark_rpm',
  'total_cash_advance',
]);

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderInvoice)
    private purchaseOrderInvoiceRepository: Repository<PurchaseOrderInvoice>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(WorkloadTicketPoHistory)
    private poHistoryRepo: Repository<WorkloadTicketPoHistory>,
    @InjectRepository(POCustomColumn)
    private poCustomColumnRepo: Repository<POCustomColumn>,
    private activityLogService: ActivityLogService,
  ) { }

  async create(
    createPurchaseOrderDTO: CreatePurchaseOrderDTO,
    user_id?: number,
    ip?: string,
    rawBody?: any,
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

    const { site_name, ...createDataPO } = createPurchaseOrderDTO;

    if (site_name && createDataPO.site_id) {
      await this.siteRepository.update({ id: createDataPO.site_id }, { name: site_name });
    }

    const po = await this.purchaseOrdersRepository.save(
      this.purchaseOrdersRepository.create({
        user_id: user_id,
        ...createDataPO,
      }),
    );

    // Save custom columns if provided
    if (rawBody && po?.id) {
      try {
        const customCols = await this.poCustomColumnRepo.find();
        const setClauses: string[] = [];
        const values: any[] = [];
        let pIdx = 1;
        for (const col of customCols) {
          if (rawBody[col.column_name] !== undefined) {
            setClauses.push(`"${col.column_name}" = $${pIdx++}`);
            const val = rawBody[col.column_name];
            values.push(val === '' ? null : val);
          }
        }
        if (setClauses.length > 0) {
          values.push(po.id);
          await this.purchaseOrdersRepository.query(
            `UPDATE purchase_orders SET ${setClauses.join(', ')} WHERE id = $${pIdx}`,
            values,
          );
        }
      } catch (err) {
        console.error('Failed to set custom columns on PO create:', err);
      }
    }

    if (createPurchaseOrderDTO.invoices) {
      const saveInvoice = createPurchaseOrderDTO.invoices;
      for (const data of saveInvoice) {
        data['user_id'] = user_id;
        data['purchase_order_id'] = po.id;
      }

      await this.purchaseOrderInvoiceRepository.save(saveInvoice);
    }

    // Fix: createdAtParseDate might be undefined after save. Use current date or reload.
    const createdDateC = po.created_at ? moment(po.created_at).format('YYYY-MM-DD HH:mm:ss') : moment().format('YYYY-MM-DD HH:mm:ss');
    const uniqueIdPO = exportUniqueId(po.id, createdDateC);

    await this.activityLogService.create({
      user_id: user_id,
      description: `Menambahkan data PO dengan nomor ${uniqueIdPO}`,
      ip: ip,
    });

    return po;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.purchaseOrdersRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.project', 'project')
      .leftJoinAndSelect('po.region', 'region')
      .leftJoinAndSelect('po.site', 'site')
      .leftJoinAndSelect('po.area', 'area')
      .leftJoinAndSelect('po.customer', 'customer');

    if (paginationOptions.search) {
      if (paginationOptions.search.includes(',')) {
        const searchItems = paginationOptions.search.split(',').map(s => s.trim());
        data.andWhere(new Brackets((qb) => {
          searchItems.forEach((search, index) => {
            if (search.split('-').length == 3) {
              const uniqueId = search.split('-')[2];
              const poDate = `${search.substring(0, 4)}-${search.substring(8, 10)}-${search.substring(10, 12)}`;

              if (!isNaN(Number(uniqueId))) {
                qb.orWhere(`(po.id = :uniqueId${index} AND DATE_TRUNC('day', "po"."created_at") = :poDate${index})`, {
                  [`uniqueId${index}`]: uniqueId,
                  [`poDate${index}`]: poDate
                });
              }
            } else {
              // Fallback for non-ID terms within the comma list? 
              // Usually comma list implies specific IDs, but user said "search multiple Biosron ID".
              // Let's assume strict Biosron ID format for simplicity or ignore invalid ones.
            }
          });
        }));
      } else if (paginationOptions.search.split('-').length == 3) {
        const uniqueId = paginationOptions.search.split('-')[2];
        const search = paginationOptions.search;
        const poDate = `${search.substring(0, 4)}-${search.substring(8, 10)}-${search.substring(10, 12)}`;
        if (!isNaN(Number(uniqueId))) {
          data
            .andWhere(`po.id = :search`, {
              search: uniqueId,
            })
            .andWhere(`DATE_TRUNC('day', "po"."created_at") = :date`, {
              date: poDate,
            });
        }
      } else {
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

    if (paginationOptions.needs_confirmation_bool) {
      data.andWhere(new Brackets((qb) => {
        qb.where(`(po.start_progress IS NOT NULL AND (po.start_progress_confirmed_by_rpm IS NULL OR po.start_progress_confirmed_by_rpm != 'YES'))`)
          .orWhere(`(po.finish_progress IS NOT NULL AND (po.finish_progress_confirmed_by_rpm IS NULL OR po.finish_progress_confirmed_by_rpm != 'YES'))`)
          .orWhere(`(po.done_atp IS NOT NULL AND (po.done_atp_confirmed_by_rpm IS NULL OR po.done_atp_confirmed_by_rpm != 'YES'))`);
      }));
    }

    if (paginationOptions.project_name) {
      data.andWhere('LOWER(project.name) LIKE LOWER(:project_name)', {
        project_name: `%${paginationOptions.project_name}%`,
      });
    }

    // Fetch registered custom columns
    let customCols: POCustomColumn[] = [];
    try {
      customCols = await this.poCustomColumnRepo.find({
        order: { order_index: 'ASC', id: 'ASC' },
      });
    } catch (e) {
      customCols = [];
    }

    const customColNames = customCols.map((c) => c.column_name);
    customColNames.forEach((cName) => {
      data.addSelect(`po."${cName}"`, cName);
    });

    data.orderBy('po.created_at', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = 50;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    if (customColNames.length > 0) {
      const { entities, raw } = await data.getRawAndEntities();
      entities.forEach((item, index) => {
        const rawItem = raw[index];
        if (rawItem) {
          customColNames.forEach((colName) => {
            (item as any)[colName] =
              rawItem[colName] !== undefined
                ? rawItem[colName]
                : rawItem[`po_${colName}`] ?? null;
          });
        }
      });
      return infinityPagination(
        entities,
        (item) => PurchaseOrderResource(item, customColNames),
        paginationOptions,
      );
    }

    return infinityPagination(
      await data.getMany(),
      (item) => PurchaseOrderResource(item, []),
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<PurchaseOrder>) {
    const customCols = await this.poCustomColumnRepo.find({
      order: { order_index: 'ASC', id: 'ASC' },
    });
    const customColNames = customCols.map((c) => c.column_name);

    const qb = this.purchaseOrdersRepository
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
      .where(fields);

    customColNames.forEach((cName) => {
      qb.addSelect(`po."${cName}"`, cName);
    });

    const { entities, raw } = await qb.getRawAndEntities();
    const data = entities[0];

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PO tidak ditemukan',
      );
    }

    if (raw && raw[0]) {
      customColNames.forEach((colName) => {
        (data as any)[colName] =
          raw[0][colName] !== undefined
            ? raw[0][colName]
            : raw[0][`po_${colName}`] ?? null;
      });
    }

    return PurchaseOrderDetailResource(data, customCols);
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
    rawBody?: any,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PO tidak ditemukan',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { invoices, deleted_invoice_id, site_name, ...updatedDataPO } =
      updatePurchaseOrderDto;

    if (site_name && updatedDataPO.site_id) {
      await this.siteRepository.update({ id: updatedDataPO.site_id }, { name: site_name });
    }

    // Logic for Auto-Fill on Finish Confirmation (RPM)
    if (updatedDataPO.finish_progress_confirmed_by_rpm === 'YES') {
      const finishProgressDate = updatedDataPO.finish_progress || exists.finish_progress;
      if (finishProgressDate) {
        updatedDataPO.actual_completion_date = finishProgressDate;
        updatedDataPO.actual_work_status = 'Work Done';
      }
    }

    // Check for amount changes for workload ticket history
    if (exists.workload_ticket_id && updatedDataPO.line_amount !== undefined && Number(updatedDataPO.line_amount) !== Number(exists.line_amount)) {
      await this.poHistoryRepo.save(this.poHistoryRepo.create({
        workload_ticket_id: exists.workload_ticket_id,
        po_id: exists.id,
        action: 'Amount Updated',
        old_amount: exists.line_amount,
        new_amount: updatedDataPO.line_amount,
        created_by: user.id,
      }));
    }

    await this.purchaseOrdersRepository.update(id, {
      ...updatedDataPO,
    });

    if (rawBody) {
      try {
        const customCols = await this.poCustomColumnRepo.find();
        const setClauses: string[] = [];
        const values: any[] = [];
        let pIdx = 1;
        for (const col of customCols) {
          if (rawBody[col.column_name] !== undefined) {
            setClauses.push(`"${col.column_name}" = $${pIdx++}`);
            const val = rawBody[col.column_name];
            values.push(val === '' ? null : val);
          }
        }
        if (setClauses.length > 0) {
          values.push(id);
          await this.purchaseOrdersRepository.query(
            `UPDATE purchase_orders SET ${setClauses.join(', ')} WHERE id = $${pIdx}`,
            values,
          );
        }
      } catch (err) {
        console.error('Failed to update custom columns on PO update:', err);
      }
    }

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

    // Detect changed columns for logging
    const changedColumns = [];
    const fieldsToCheck = [
      'start_progress', 'finish_progress', 'done_atp',
      'remark_ss', 'remark_rpm', 'status', 'start_progress_confirmed_by_rpm',
      'finish_progress_confirmed_by_rpm', 'done_atp_confirmed_by_rpm', 'actual_completion_date', 'actual_work_status'
    ];



    fieldsToCheck.forEach(field => {
      if (updatedDataPO.hasOwnProperty(field)) {
        let newValue = updatedDataPO[field];
        let oldValue = exists[field];

        let isDifferent = false;

        // Normalize for comparison
        const normalize = (val) => {
          if (val === null || val === undefined) return '';
          // Check if date-like (simple check or moment)
          // If it's a Date object, formatting it usually works best for comparison with DB strings
          if (val instanceof Date) {
            return moment(val).format('YYYY-MM-DD');
          }
          if (typeof val === 'string' && val.length > 10 && moment(val, moment.ISO_8601, true).isValid()) {
            return moment(val).format('YYYY-MM-DD');
          }
          return val.toString().trim();
        };

        const normNew = normalize(newValue);
        const normOld = normalize(oldValue);

        if (normNew !== normOld) {
          isDifferent = true;

        }

        if (isDifferent) {
          const humanField = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          changedColumns.push(humanField);
        }
      }
    });

    // Check if rawBody or updatePurchaseOrderDto has any custom column fields
    try {
      const customCols = await this.poCustomColumnRepo.find();
      const customColMap = new Map(customCols.map((c) => [c.column_name, c]));
      const bodyToInspect = { ...(rawBody || {}), ...updatePurchaseOrderDto };

      for (const key of Object.keys(bodyToInspect)) {
        if (customColMap.has(key)) {
          const val = bodyToInspect[key] === '' ? null : bodyToInspect[key];
          await this.purchaseOrdersRepository.query(
            `UPDATE purchase_orders SET "${key}" = $1 WHERE id = $2`,
            [val, id],
          );
          const label = customColMap.get(key)?.display_label || key;
          changedColumns.push(label);
        }
      }
    } catch (errCustom) {
      console.error('Error updating custom columns:', errCustom);
    }

    let logDescription;
    // Use exists which we know has the correct properties from the logs
    // Ensure createdAtParseDate is available or derive it
    const createdDateForId = exists.createdAtParseDate || (exists.created_at ? moment(exists.created_at).format('YYYY-MM-DD HH:mm:ss') : null);
    const uniqueId = exportUniqueId(exists.id, createdDateForId);

    if (changedColumns.length > 0) {
      logDescription = `Updated Column ${changedColumns.join(', ')} on PO ${uniqueId}`;
    } else {
      logDescription = `Mengupdate Data PO dengan nomor ${uniqueId}`;
    }

    try {
      await this.activityLogService.create({
        user_id: user.id,
        description: logDescription,
        ip: ip,
      });

    } catch (error) {
      console.error('ERROR creating activity log:', error);
    }

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

  async listColumns() {
    const customColumns = await this.poCustomColumnRepo.find({
      order: { order_index: 'ASC', id: 'ASC' },
    });

    const dbColumns = await this.purchaseOrdersRepository.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'purchase_orders'
      ORDER BY ordinal_position;
    `);

    const customColNames = new Set(customColumns.map((c) => c.column_name));

    const systemColumns = dbColumns
      .filter((c: any) => !customColNames.has(c.column_name))
      .map((c: any) => ({
        column_name: c.column_name,
        display_label: c.column_name
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        data_type: c.data_type,
        is_system: true,
        can_delete: false,
        reason: 'Kolom inti sistem yang terhubung dengan modul lain (SPK, Workload Tickets, Invoices, dll).',
      }));

    return {
      custom_columns: customColumns.map((c) => ({
        id: c.id,
        column_name: c.column_name,
        display_label: c.display_label,
        data_type: c.data_type,
        width: c.width,
        is_required: c.is_required,
        is_system: false,
        can_delete: true,
      })),
      system_columns: systemColumns,
    };
  }

  async checkSafeDeleteColumn(columnName: string) {
    const colLower = columnName.toLowerCase().trim();

    // 1. Is it a protected core system column?
    if (PROTECTED_PO_COLUMNS.has(colLower)) {
      return {
        safe: false,
        can_delete: false,
        is_system: true,
        column_name: colLower,
        message:
          'Kolom ini adalah kolom sistem utama yang terhubung dengan modul lain (SPK, Workload Tickets, Invoices, Relasi, dll) dan tidak dapat dihapus.',
      };
    }

    // 2. Check if column exists in purchase_orders table
    const existsInDb = await this.purchaseOrdersRepository.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = $1`,
      [colLower],
    );

    if (existsInDb.length === 0) {
      throw failedResponse(
        HttpStatus.NOT_FOUND,
        `Kolom '${colLower}' tidak ditemukan di tabel purchase_orders`,
      );
    }

    // 3. Check if registered in custom columns
    const customCol = await this.poCustomColumnRepo.findOne({
      where: { column_name: colLower },
    });

    if (!customCol) {
      return {
        safe: false,
        can_delete: false,
        is_system: true,
        column_name: colLower,
        message:
          'Kolom ini adalah kolom internal database yang tidak terdaftar sebagai kolom kustom dan tidak dapat dihapus.',
      };
    }

    // 4. Check for foreign key constraints or dependencies
    const fkConstraints = await this.purchaseOrdersRepository.query(
      `
      SELECT tc.constraint_name, tc.table_name, kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'purchase_orders' AND kcu.column_name = $1
    `,
      [colLower],
    );

    if (fkConstraints.length > 0) {
      return {
        safe: false,
        can_delete: false,
        is_system: false,
        has_constraints: true,
        column_name: colLower,
        message: `Kolom ini terhubung dengan Foreign Key atau constraint database (${fkConstraints[0].constraint_name}).`,
      };
    }

    // 5. Check row count with active data
    const countRes = await this.purchaseOrdersRepository.query(
      `SELECT COUNT(*)::int as count FROM purchase_orders WHERE "${colLower}" IS NOT NULL AND deleted_at IS NULL`,
    );
    const dataCount = Number(countRes[0]?.count || 0);

    if (dataCount > 0) {
      return {
        safe: true,
        can_delete: true,
        is_system: false,
        has_data: true,
        data_count: dataCount,
        column_name: colLower,
        display_label: customCol.display_label,
        warning: `Kolom '${customCol.display_label}' memiliki ${dataCount} data yang tersimpan di baris PO. Menghapusnya akan menghilangkan data tersebut secara permanen.`,
      };
    }

    return {
      safe: true,
      can_delete: true,
      is_system: false,
      has_data: false,
      data_count: 0,
      column_name: colLower,
      display_label: customCol.display_label,
      message: `Kolom '${customCol.display_label}' aman untuk dihapus (tidak memiliki data aktif).`,
    };
  }

  async addColumn(dto: CreatePOColumnDTO, user: User, ip: string) {
    // 1. Generate & sanitize column name
    let colName = dto.column_name
      ? dto.column_name.toLowerCase().trim()
      : `col_${dto.display_label
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')}`;

    if (!colName.startsWith('col_') && !colName.startsWith('cust_')) {
      colName = `col_${colName}`;
    }
    // Limit length to 60 chars (PostgreSQL identifier max is 63)
    colName = colName.substring(0, 60);

    // Validate identifier format
    if (!/^[a-z][a-z0-9_]*$/.test(colName)) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Format nama kolom tidak valid. Gunakan huruf kecil, angka, dan garis bawah.',
      );
    }

    // 2. Check collisions
    if (PROTECTED_PO_COLUMNS.has(colName)) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `Nama kolom '${colName}' merupakan nama kolom sistem dan tidak dapat digunakan.`,
      );
    }

    const existsInDb = await this.purchaseOrdersRepository.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = $1`,
      [colName],
    );
    if (existsInDb.length > 0) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `Kolom '${colName}' sudah ada di database tabel purchase_orders.`,
      );
    }

    const existsInCustom = await this.poCustomColumnRepo.findOne({
      where: { column_name: colName },
    });
    if (existsInCustom) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `Kolom '${colName}' sudah terdaftar.`,
      );
    }

    // 3. Map SQL type
    let sqlType = 'VARCHAR(255)';
    switch (dto.data_type) {
      case 'text':
        sqlType = 'TEXT';
        break;
      case 'numeric':
        sqlType = 'NUMERIC';
        break;
      case 'date':
        sqlType = 'DATE';
        break;
      case 'boolean':
        sqlType = 'BOOLEAN';
        break;
      case 'varchar':
      default:
        sqlType = 'VARCHAR(255)';
        break;
    }

    // 4. Alter table in database
    try {
      await this.purchaseOrdersRepository.query(
        `ALTER TABLE purchase_orders ADD COLUMN "${colName}" ${sqlType};`,
      );
    } catch (err: any) {
      throw failedResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Gagal menambahkan kolom ke database: ${err.message}`,
      );
    }

    // 5. Save in po_custom_columns metadata
    const newCol = await this.poCustomColumnRepo.save(
      this.poCustomColumnRepo.create({
        column_name: colName,
        display_label: dto.display_label,
        data_type: dto.data_type,
        width: dto.width || 150,
        is_required: dto.is_required || false,
      }),
    );

    // 6. Activity log
    try {
      await this.activityLogService.create({
        user_id: user.id,
        description: `Menambahkan kolom database PO baru: ${dto.display_label} (${colName}, tipe: ${dto.data_type})`,
        ip: ip,
      });
    } catch (logErr) {
      console.error('Error logging column addition:', logErr);
    }

    return newCol;
  }

  async deleteColumn(
    columnName: string,
    confirm: boolean,
    user: User,
    ip: string,
  ) {
    const check = await this.checkSafeDeleteColumn(columnName);

    if (!check.can_delete) {
      throw failedResponse(HttpStatus.BAD_REQUEST, check.message);
    }

    if (check.has_data && !confirm) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `${check.warning} Konfirmasi diperlukan untuk menghapus.`,
      );
    }

    const colLower = columnName.toLowerCase().trim();

    try {
      await this.purchaseOrdersRepository.query(
        `ALTER TABLE purchase_orders DROP COLUMN IF EXISTS "${colLower}";`,
      );
    } catch (err: any) {
      throw failedResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Gagal menghapus kolom dari database: ${err.message}`,
      );
    }

    await this.poCustomColumnRepo.delete({ column_name: colLower });

    try {
      await this.activityLogService.create({
        user_id: user.id,
        description: `Menghapus kolom database PO: ${colLower} (Data terhapus: ${
          check.data_count || 0
        } baris)`,
        ip: ip,
      });
    } catch (logErr) {
      console.error('Error logging column deletion:', logErr);
    }

    return {
      success: true,
      column_name: colLower,
      message: `Kolom '${colLower}' berhasil dihapus dari database purchase_orders.`,
    };
  }

  async updateCustomColumnValue(
    id: number,
    columnName: string,
    value: any,
    user: User,
    ip: string,
  ) {
    const colLower = columnName.toLowerCase().trim();
    const customCol = await this.poCustomColumnRepo.findOne({
      where: { column_name: colLower },
    });
    if (!customCol) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `Kolom kustom '${colLower}' tidak ditemukan.`,
      );
    }

    const val = value === '' ? null : value;
    await this.purchaseOrdersRepository.query(
      `UPDATE purchase_orders SET "${colLower}" = $1 WHERE id = $2`,
      [val, id],
    );

    try {
      await this.activityLogService.create({
        user_id: user.id,
        description: `Mengupdate kolom kustom '${customCol.display_label}' pada PO ID ${id}`,
        ip: ip,
      });
    } catch (e) {
      console.error(e);
    }

    return { id, column_name: colLower, value: val };
  }
}
