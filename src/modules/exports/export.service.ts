import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Brackets, Repository, getManager } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ExportUserResource } from './resources/export-user.resources';
import * as fs from 'fs';
import * as path from 'path';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { ExportPOResource } from './resources/export-po.resources';
import * as xlsx from 'xlsx';
import moment from 'moment';
import { SPK } from 'src/entities/spk.entity';
import { ExportSPKResource } from './resources/export-spk.resources';
import { Absence } from 'src/entities/absence.entity';
import { ExportAbsenceResource } from './resources/export-absence.resources';
import { UsersService } from '../users/users.service';
import { RoleEnum, SPKStatus } from 'src/utils/enums';
import { ExportSPKOperationalResource } from './resources/export-spk-operational.resources';
import { SPKOperational } from 'src/entities/spk-operationals.entity';
import * as async from 'async';
import { ExportJob } from 'src/entities/export-job.entity';

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
    @InjectRepository(ExportJob)
    private exportJobRepository: Repository<ExportJob>,
    private activityLogService: ActivityLogService,
    private userService: UsersService,
  ) {
    this.exportQueue = async.queue(async (task, callback) => {
      try {
        await this.processJob(task);
        callback();
      } catch (err) {
        callback(err);
      }
    }, 1);
  }

  private exportQueue: async.QueueObject<any>;

  async getJobs(user: User) {
    return this.exportJobRepository.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
      take: 20
    });
  }

  async getJob(id: string, user: User) {
    return this.exportJobRepository.findOne({ where: { id, user_id: user.id } });
  }

  async exportPO(
    user: User,
    ip: string,
    startDate: string,
    endDate: string,
    search: string,
    status: string,
  ) {
    const job = new ExportJob();
    job.user_id = user.id;
    job.type = 'PO';
    job.payload = JSON.stringify({ ip, startDate, endDate, search, status });
    job.status = 'PENDING';
    await this.exportJobRepository.save(job);

    this.exportQueue.push(job.id);

    return job;
  }

  private async processJob(jobId: string) {
    const job = await this.exportJobRepository.findOne(jobId);
    if (!job) return;

    job.status = 'PROCESSING';
    await this.exportJobRepository.save(job);

    try {
      let filePath = '';
      const payload = JSON.parse(job.payload || '{}');

      if (job.type === 'PO') {
        const user = await this.usersRepository.findOne(job.user_id);
        filePath = await this._generatePOFile(
          user,
          payload.ip,
          payload.startDate,
          payload.endDate,
          payload.search,
          payload.status
        ) as string;
      }

      job.status = 'COMPLETED';
      job.file_path = filePath;
      // Clean up old files logic could go here or cron
      await this.exportJobRepository.save(job);

    } catch (err) {
      job.status = 'FAILED';
      job.error_message = err.message;
      await this.exportJobRepository.save(job);
    }
  }

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

    const exportsDir = path.resolve('./exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    const fileName = `Pengguna-${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    XLSX.writeFile(wb, filePath, { compression: true });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data Pengguna`,
      ip: ip,
    });

    return filePath;
  }

  private async _generatePOFile(
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
      .addSelect((subQuery) => {
        return subQuery
          .select('COALESCE(SUM(s.cash_advance), 0)', 'total_cash_advance')
          .from(SPK, 's')
          .where('s.po_id = po.id')
          .andWhere(
            new Brackets((qb) => {
              qb.where('s.status = :status1', { status1: SPKStatus.PAID })
                .orWhere('s.status = :status2', {
                  status2: SPKStatus.PAID_NEED_EVIDENCE,
                })
                .orWhere('s.status = :status3', {
                  status3: SPKStatus.CLOSED,
                });
            }),
          );
      }, 'po_total_cash_advance')

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

    console.log('[ExportPO] Start Get Count');

    const queryCount = query.getQueryAndParameters();
    const queryCountStr = queryCount[0].replace(
      /SELECT\s+([\s\S]*?)\s+FROM/,
      'SELECT COUNT(1) FROM',
    );
    let count = await getManager().query(queryCountStr, queryCount[1]);
    count = count[0].count;

    console.log('[ExportPO] Done Get Count : ' + count);

    query.orderBy('po.id', 'DESC');

    const perLoop = 1000;
    const loopCount = Math.ceil(count / perLoop);

    query.limit(perLoop);

    const arr = Array.from(new Array(loopCount), (x, i) => i);

    // Use sequential loop to ensure completion before writing file
    try {
      for (const value of arr) {
        console.log(
          '[ExportPO] Start Get Data : ' + value + ' of ' + loopCount,
        );
        query.offset(value * perLoop);

        const data = await query.getMany();

        data.forEach((d) => {
          rows.push(ExportPOResource(d));
        });
      }
      // Sort after all data is fetched
      rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    } catch (err) {
      console.error(err.message);
      throw err;
    }

    console.log('[ExportPO] Start Loop Invoice ' + rows.length);
    let iid = 0;
    let longestColumn = 0;
    let longestColumnId = 0;

    rows.forEach((d) => {
      iid++;

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

      if (d.invoices.length > longestColumn) {
        longestColumn = d.invoices.length;
        longestColumnId = iid - 1;
      }

      delete d.invoices;
    });

    console.log('[ExportPO] Done Loop Invoice');

    const XLSX = xlsx;

    const outputData = rows.map(Object.values);
    outputData.unshift(Object.keys(rows[longestColumnId]));

    const workSheet = XLSX.utils.aoa_to_sheet(outputData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, workSheet, 'Detail');

    console.log('[ExportPO] Start Create File');
    const exportsDir = path.resolve('./exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    const fileName = `PO${prefixDate.replace(/[: ]/g, '_')}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    XLSX.writeFile(wb, filePath, { compression: true });

    console.log('[ExportPO] Done Create File: ' + filePath);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data PO`,
      ip: ip,
    });

    return filePath;
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
      )
      .leftJoinAndSelect(
        'spk.subcategory',
        'subcategory',
        'subcategory.deleted_at IS NULL',
      );

    const currentUser = await this.userService.findOneFull({ id: user.id });
    if (
      currentUser.employeePosition.code != RoleEnum.PM &&
      currentUser.employeePosition.code != RoleEnum.SUPERADMIN
    ) {
      query.where('spk.deleted_at IS NULL');
    }

    if (search) {
      // --- Logic to handle Unique IDs ---
      const potentialUniqueIds = search.split(',').map(item => item.trim());
      const extractedIds = [];
      const uniqueIdRegex = /^\d{4}BSN-\d{4}-(\d+)$/;

      for (const pId of potentialUniqueIds) {
        const match = pId.match(uniqueIdRegex);
        if (match) {
          extractedIds.push(match[1]);
        }
      }
      // --- End of Unique ID Logic ---

      if (extractedIds.length > 0) {
        // Priority 1: Search by one or more Unique IDs
        query.andWhere('spk.id IN (:...ids)', { ids: extractedIds });

      } else if (search.includes(',')) {
        // Priority 2: If commas exist, search by a list of exact "No BOP" numbers
        const spkNumbers = search.split(',').map(item => item.trim());
        query.andWhere('spk.spk_number IN (:...spkNumbers)', { spkNumbers });

      } else {
        // Priority 3: Fallback to a single-term search on "No BOP" and "DU ID"
        query.andWhere(
          new Brackets((qb) => {
            qb.where('spk.spk_number ILIKE :search', {
              search: `%${search}%`,
            }).orWhere('site.code ILIKE :searchSite', {
              searchSite: `%${search}%`,
            });
          }),
        );
      }
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

    const exportsDir = path.resolve('./exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    const fileName = `SPK-${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    XLSX.writeFile(wb, filePath, { compression: true });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data SPK`,
      ip: ip,
    });

    return filePath;
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

    const exportsDir = path.resolve('./exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    const fileName = `Absence-${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    XLSX.writeFile(wb, filePath, { compression: true });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data Absence`,
      ip: ip,
    });

    return filePath;
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
      )
      .leftJoinAndSelect(
        'spk-operational.subcategory',
        'subcategory',
        'subcategory.deleted_at IS NULL',
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

    const exportsDir = path.resolve('./exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    const fileName = `SPK-Operational-${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    XLSX.writeFile(wb, filePath, { compression: true });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Export Data SPK`,
      ip: ip,
    });

    return filePath;
  }
}
