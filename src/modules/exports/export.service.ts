import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Brackets, Repository, getManager } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ExportUserResource } from './resources/export-user.resources';
import * as tmp from 'tmp';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { ExportPOResource } from './resources/export-po.resources';
import * as xlsx from 'xlsx';
import moment from 'moment';
import { SPK } from 'src/entities/spk.entity';
import { ExportSPKResource } from './resources/export-spk.resources';
import { Absence } from 'src/entities/absence.entity';
import { ExportAbsenceResource } from './resources/export-absence.resources';
import { UsersService } from '../users/users.service';
import { RoleEnum } from 'src/utils/enums';
import { ExportSPKOperationalResource } from './resources/export-spk-operational.resources';
import { SPKOperational } from 'src/entities/spk-operationals.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(SPK)
    private spkRepository: Repository<SPK>,
    @InjectRepository(Absence)
    private absenceRepository: Repository<Absence>,
    @InjectRepository(SPKOperational)
    private spkOperationalRepository: Repository<SPKOperational>,
    private activityLogService: ActivityLogService,
    private userService: UsersService,
  ) { }

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
    const rows = [];

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
      .leftJoinAndSelect('po.po_invoice', 'po_invoice')
      .leftJoinAndSelect('po.pic_data', 'pic_data')
      .orderBy('po.id', 'DESC');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`LOWER(po.cc) LIKE :search`, {
            search: `%${search.toLowerCase()}%`,
          })
            .orWhere(`LOWER(po.po_number) LIKE :search`, {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere(`LOWER(site.code) LIKE :search`, {
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

    let prefixDate = ` until ${moment(new Date()).format(
      'YYYY-MM-DD HH:mm:ss',
    )}`;

    if (startDate && endDate) {
      query.andWhere(`po.created_at >= :startDate`, {
        startDate: startDate,
      });
      query.andWhere(`po.created_at <= :endDate`, {
        endDate: endDate,
      });

      prefixDate = ` from ${startDate} to ${endDate}`;
    }

    const count = await query.getCount();

    const perLoop = 1000;
    const loopCount = Math.ceil(count[0].count / perLoop);

    query.limit(perLoop);

    for (let idx = 0; idx < loopCount; idx++) {
      query.offset(idx * perLoop);

      const data = await query.getMany();

      data.forEach((d) => {
        rows.push(ExportPOResource(d));
      });
    }

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
        d[`AC${index + 1} Submit Date`] = element.submit_date;
        d[`AC${index + 1} Submit Amount`] = element.submit_amount;
        d[`AC${index + 1} Approve Date`] = element.approve_date;
        d[`AC${index + 1} Approve Amount`] = element.approve_amount;
      });

      delete d.invoices;
    });

    const XLSX = xlsx;
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, 'Detail');

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: `PO${prefixDate}`, postfix: '.xlsx' },
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
      .withDeleted()
      .leftJoinAndSelect('spk.region', 'region', 'region.deleted_at IS NULL')
      .leftJoinAndSelect(
        'spk.transportation',
        'transportation',
        'transportation.deleted_at IS NULL',
      )
      .leftJoinAndSelect('spk.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect('spk.site', 'site', 'site.deleted_at IS NULL')
      .leftJoinAndSelect('spk.area', 'area', 'area.deleted_at IS NULL')
      .leftJoinAndSelect('spk.po', 'po', 'po.deleted_at IS NULL')
      .leftJoinAndSelect('site.sitePO', 'sitePO', 'sitePO.deleted_at IS NULL')
      .leftJoinAndSelect(
        'sitePO.project',
        'project',
        'project.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'spk.inhouse_team',
        'inhouse_team',
        'inhouse_team.deleted_at IS NULL',
      )
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .leftJoinAndSelect(
        'userInhouse.employeePosition',
        'employeePosition',
        'employeePosition.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'spk.distance_to_site_file',
        'distance_to_site_file',
        'distance_to_site_file.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'spk.cost_evidences',
        'cost_evidences',
        'cost_evidences.deleted_at IS NULL',
      )
      .leftJoinAndSelect('spk.created_by_user', 'created_by_user')
      .leftJoinAndSelect('spk.approved_by_user', 'approved_by_user')
      .leftJoinAndSelect(
        'spk.approved_over_budget_by_user',
        'approved_over_budget_by_user',
      )
      .leftJoinAndSelect('spk.paid_by_user', 'paid_by_user')
      .leftJoinAndSelect('spk.closed_by_user', 'closed_by_user')
      .leftJoinAndSelect(
        'spk.category',
        'category',
        'category.deleted_at IS NULL',
      );

    const currentUser = await this.userService.findOneFull({ id: user.id });
    if (
      currentUser.employeePosition.code != RoleEnum.PM &&
      currentUser.employeePosition.code != RoleEnum.SUPERADMIN
    ) {
      query.where('spk.deleted_at IS NULL');
    }

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
      description: `Export Data SPK`,
      ip: ip,
    });

    return f;
  }

  async exportAbsence(
    user: User,
    ip: string,
    search: string,
    startDate: string,
    endDate: string,
  ) {
    const query = this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.user', 'user')
      .leftJoinAndSelect('absence.clock_in_photo_file', 'clock_in_photo_file')
      .leftJoinAndSelect('absence.clock_out_photo_file', 'clock_out_photo_file')
      .orderBy('absence.created_at', 'DESC');

    if (search) {
      query.andWhere('user.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (startDate && endDate) {
      query.andWhere(`absence.created_at >= :startDate`, {
        startDate: startDate,
      });
      query.andWhere(`absence.created_at <= :endDate`, {
        endDate: endDate,
      });
    }

    const data = await query.getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(ExportAbsenceResource(d));
    });

    const XLSX = xlsx;
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, 'Detail');

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: 'Absence-', postfix: '.xlsx' },
        function _tempFileCreated(err, path) {
          if (err) throw err;

          XLSX.writeFile(wb, path, { compression: true });
          resolve(path);
        },
      );
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data Absence`,
      ip: ip,
    });

    return f;
  }

  async exportSPKOperational(
    user: User,
    ip: string,
    startDate: string,
    endDate: string,
    search: string,
    status: string,
  ) {
    const query = this.spkOperationalRepository
      .createQueryBuilder('spk-operational')
      .withDeleted()
      .leftJoinAndSelect(
        'spk-operational.region',
        'region',
        'region.deleted_at IS NULL',
      )
      .leftJoinAndSelect('spk-operational.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect(
        'spk-operational.area',
        'area',
        'area.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'spk-operational.inhouse_team',
        'inhouse_team',
        'inhouse_team.deleted_at IS NULL',
      )
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .leftJoinAndSelect(
        'userInhouse.employeePosition',
        'employeePosition',
        'employeePosition.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'spk-operational.cost_evidences',
        'cost_evidences',
        'cost_evidences.deleted_at IS NULL',
      )
      .leftJoinAndSelect('spk-operational.created_by_user', 'created_by_user')
      .leftJoinAndSelect('spk-operational.approved_by_user', 'approved_by_user')
      .leftJoinAndSelect(
        'spk-operational.approved_over_budget_by_user',
        'approved_over_budget_by_user',
      )
      .leftJoinAndSelect('spk-operational.paid_by_user', 'paid_by_user')
      .leftJoinAndSelect('spk-operational.closed_by_user', 'closed_by_user')
      .leftJoinAndSelect(
        'spk-operational.category',
        'category',
        'category.deleted_at IS NULL',
      );

    const currentUser = await this.userService.findOneFull({ id: user.id });
    if (
      currentUser.employeePosition.code != RoleEnum.PM &&
      currentUser.employeePosition.code != RoleEnum.SUPERADMIN
    ) {
      query.where('spk-operational.deleted_at IS NULL');
    }

    if (search) {
      query.andWhere('spk-operational.spk_number ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status) {
      query.andWhere('spk-operational.status = :status', {
        status: status,
      });
    }

    if (startDate && endDate) {
      query.andWhere(`spk-operational.created_at >= :startDate`, {
        startDate: startDate,
      });
      query.andWhere(`spk-operational.created_at <= :endDate`, {
        endDate: endDate,
      });
    }

    const data = await query.getMany();

    const rows = [];

    data.forEach((d) => {
      rows.push(ExportSPKOperationalResource(d));
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

      delete d.inhouse_team;
      delete d.cost_evidences;
    });

    const XLSX = xlsx;
    const workSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, 'Detail');

    const f = await new Promise((resolve) => {
      tmp.file(
        { mode: 0o644, prefix: 'SPK-Operational-', postfix: '.xlsx' },
        function _tempFileCreated(err, path) {
          if (err) throw err;

          XLSX.writeFile(wb, path, { compression: true });
          resolve(path);
        },
      );
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data SPK`,
      ip: ip,
    });

    return f;
  }
}
