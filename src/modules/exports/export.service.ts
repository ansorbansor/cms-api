import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Brackets, Repository } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ExportUserResource } from './resources/export-user.resources';
import * as tmp from 'tmp';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { ExportPOResource } from './resources/export-po.resources';
import * as xlsx from 'xlsx';
import { SPK } from 'src/entities/spk.entity';
import { ExportSPKResource } from './resources/export-spk.resources';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(SPK)
    private spkRepository: Repository<SPK>,
    private activityLogService: ActivityLogService,
  ) {}

  async exportUser(user: User, ip: string, search: string) {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .leftJoinAndSelect('employeePosition.roleAccess', 'roleAccess')
      .leftJoinAndSelect('roleAccess.menu', 'menu')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .orderBy('user.name', 'ASC');

    if (search) {
      query.andWhere('user.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const data = await query.getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(ExportUserResource(d));
    });

    const XLSX = xlsx;
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, 'Detail');

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: 'Pengguna-', postfix: '.xlsx' },
        function _tempFileCreated(err, path) {
          if (err) throw err;

          XLSX.writeFile(wb, path, { compression: true });
          resolve(path);
        },
      );
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data Pengguna`,
      ip: ip,
    });

    return f;
  }

  async exportPO(
    user: User,
    ip: string,
    startDate: string,
    endDate: string,
    search: string,
    status: string,
  ) {
    const query = this.purchaseOrdersRepository
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
      .leftJoinAndSelect('po.po_invoice', 'po_invoice');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`LOWER(po.cc) LIKE :search`, {
            search: `%${search.toLowerCase()}%`,
          }).orWhere(`LOWER(po.po_number) LIKE :search`, {
            search: `%${search.toLowerCase()}%`,
          });
        }),
      );
    }

    if (status) {
      query.andWhere('LOWER(po.status) = :status', {
        status: status,
      });
    }

    if (startDate && endDate) {
      query.andWhere(`po.created_at >= :startDate`, {
        startDate: startDate,
      });
      query.andWhere(`po.created_at <= :endDate`, {
        endDate: endDate,
      });
    }

    const data = await query.getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(ExportPOResource(d));
    });

    rows.forEach((d) => {
      d.invoices.forEach((element, index) => {
        d[`AC${index + 1} Inv`] = element.invoice_number;
        d[`AC${index + 1} Inv Date`] = element.date;
        d[`AC${index + 1} Inv Status`] = element.status;
        d[`Payment Date ${index + 1}`] = element.payment_date;
        d[`AC${index + 1} (Supplier Tax Invoice No.)`] = element.payment_date;
        d[`AC${index + 1} (Supplier Tax Invoice No.) Date`] =
          element.payment_date;
        d[`AC${index + 1} Payment Amount`] = element.payment_amount;
        d[`AC${index + 1} Deduction Amount`] = element.deduction_amount;
        d[`AC${index + 1} Unit Price`] = element.unit_price;
      });
    });

    const XLSX = xlsx;
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, 'Detail');

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: 'PO-', postfix: '.xlsx' },
        function _tempFileCreated(err, path) {
          if (err) throw err;

          XLSX.writeFile(wb, path, { compression: true });
          resolve(path);
        },
      );
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data PO`,
      ip: ip,
    });

    return f;
  }

  async exportSPK(
    user: User,
    ip: string,
    startDate: string,
    endDate: string,
    search: string,
    status: string,
  ) {
    const query = this.spkRepository
      .createQueryBuilder('spk')
      .leftJoinAndSelect('spk.region', 'region')
      .leftJoinAndSelect('spk.transportation', 'transportation')
      .leftJoinAndSelect('spk.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect('spk.site', 'site')
      .leftJoinAndSelect('spk.area', 'area')
      .leftJoinAndSelect('spk.po', 'po')
      .leftJoinAndSelect('site.sitePO', 'sitePO')
      .leftJoinAndSelect('sitePO.project', 'project')
      .leftJoinAndSelect('spk.inhouse_team', 'inhouse_team')
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .leftJoinAndSelect('userInhouse.employeePosition', 'employeePosition')
      .leftJoinAndSelect('spk.distance_to_site_file', 'distance_to_site_file')
      .leftJoinAndSelect('spk.cost_evidences', 'cost_evidences')
      .leftJoinAndSelect('spk.created_by_user', 'created_by_user')
      .leftJoinAndSelect('spk.approved_by_user', 'approved_by_user')
      .leftJoinAndSelect(
        'spk.approved_over_budget_by_user',
        'approved_over_budget_by_user',
      )
      .leftJoinAndSelect('spk.paid_by_user', 'paid_by_user')
      .leftJoinAndSelect('spk.closed_by_user', 'closed_by_user')
      .leftJoinAndSelect('spk.category', 'category');

    if (search) {
      query.andWhere('spk.spk_number ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status) {
      query.andWhere('spk.status = :status', {
        status: status,
      });
    }

    if (startDate && endDate) {
      query.andWhere(`spk.created_at >= :startDate`, {
        startDate: startDate,
      });
      query.andWhere(`spk.created_at <= :endDate`, {
        endDate: endDate,
      });
    }

    const data = await query.getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(ExportSPKResource(d));
    });

    rows.forEach((d) => {
      d.inhouse_team.forEach((element, index) => {
        d[`inhouse_team_${index + 1}`] = element.name;
        d[`inhouse_team_position_${index + 1}`] = element.position;
      });
      d.cost_evidences.forEach((element, index) => {
        d[`cost_evidences_${index + 1}`] = element.name;
        d[`cost_evidences_cost_${index + 1}`] = element.cost;
      });
      d.sitePO.forEach((element, index) => {
        d[`po_number_${index + 1}`] = element.po_number;
        d[`project_name_${index + 1}`] = element.name;
      });

      delete d.inhouse_team;
      delete d.cost_evidences;
      delete d.sitePO;
    });

    const XLSX = xlsx;
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, 'Detail');

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: 'SPK-', postfix: '.xlsx' },
        function _tempFileCreated(err, path) {
          if (err) throw err;

          XLSX.writeFile(wb, path, { compression: true });
          resolve(path);
        },
      );
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data Pengguna`,
      ip: ip,
    });

    return f;
  }
}
