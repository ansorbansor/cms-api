import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { failedResponse } from 'src/utils/responses';
import { Brackets, Repository } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ExportUserResource } from './resources/export-user.resources';
import * as tmp from 'tmp';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { ExportPOResource } from './resources/export-po.resources';
import * as xlsx from 'xlsx';
import { SPK } from 'src/entities/spk.entity';
import { ExportSPKResource } from './resources/export-spk.resources';
import * as moment from 'moment';

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

  async exportUser(user: User, ip: string) {
    const data = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'employeePosition')
      .leftJoinAndSelect('employeePosition.roleAccess', 'roleAccess')
      .leftJoinAndSelect('roleAccess.menu', 'menu')
      .leftJoinAndSelect('user.photoFile', 'photoFile')
      .orderBy('user.name', 'ASC')
      .getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(ExportUserResource(d));
    });

    const XLSX = xlsx;
    const fileName = 'Users.xlsx';
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, fileName);

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

  async exportPO(user: User, ip: string, startDate: string, endDate: string) {
    if (!startDate || !endDate) {
      startDate = moment().subtract(30, 'd').format('YYYY-MM-DD HH:mm:ss');
      endDate = moment().format('YYYY-MM-DD HH:mm:ss');
    }

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
      .where(`po.created_at >= :startDate`, {
        startDate: startDate,
      })
      .andWhere(`po.created_at <= :endDate`, {
        endDate: endDate,
      })
      .getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(ExportPOResource(d));
    });

    rows.forEach((d) => {
      d.invoices.forEach((element, index) => {
        d[`invoice_number_${index + 1}`] = element.invoice_number;
        d[`invoice_number_date_${index + 1}`] = element.date;
        d[`invoice_number_status_${index + 1}`] = element.status;
        d[`invoice_number_payment_date_${index + 1}`] = element.payment_date;
        d[`invoice_number_suppliertax_${index + 1}`] = element.payment_date;
        d[`invoice_number_suppliertax_date_${index + 1}`] =
          element.payment_date;
        d[`invoice_number_payment_amount_${index + 1}`] =
          element.payment_amount;
        d[`invoice_number_deduction_amount_${index + 1}`] =
          element.deduction_amount;
      });
    });

    const XLSX = xlsx;
    const fileName = 'PurchaseOrders.xlsx';
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, fileName);

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

  async exportSPK(user: User, ip: string, startDate: string, endDate: string) {
    if (!startDate || !endDate) {
      startDate = moment().subtract(30, 'd').format('YYYY-MM-DD HH:mm:ss');
      endDate = moment().format('YYYY-MM-DD HH:mm:ss');
    }

    const data = await this.spkRepository
      .createQueryBuilder('spk')
      .leftJoinAndSelect('spk.region', 'region')
      .leftJoinAndSelect('spk.transportation', 'transportation')
      .leftJoinAndSelect('spk.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect('spk.site', 'site')
      .leftJoinAndSelect('spk.area', 'area')
      .leftJoinAndSelect('spk.po', 'po')
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
      .where(`spk.created_at >= :startDate`, {
        startDate: startDate,
      })
      .andWhere(`spk.created_at <= :endDate`, {
        endDate: endDate,
      })
      .getMany();

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
    });

    const XLSX = xlsx;
    const fileName = 'SPK.xlsx';
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, fileName);

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
