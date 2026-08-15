import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, getManager, In, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { SPK } from 'src/entities/spk.entity';
import { CreateSPKDTO } from './dto/create.spk.dto';
import { UpdateSPKDTO } from './dto/update-spk.dto';
import { FilesService } from '../files/files.service';
import { FilePath, MenuPermission, RoleEnum, SPKStatus } from 'src/utils/enums';
import { SPKInhouseTeam } from 'src/entities/spk-inhouse-team.entity';
import { UpdateSPKSettlementDTO } from './dto/update-spk-settlement.dto';
import { SPKCostEvidence } from 'src/entities/spk-cost-evidence.entity';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import * as fs from 'fs';
import moment from 'moment';
import { SPKResource, SPKResourceDetail } from './resources/spk.resources';
import { UsersService } from '../users/users.service';
import { SPKCategory } from 'src/entities/spk-category.entity';
import { SPKCategoryResource } from './resources/spk-category.resources';
import { log } from 'console';
import { SPKSubCategory } from 'src/entities/spk-subcategory.entity';
import { SPKSubCategoryResource } from './resources/spk-subcategory.resources';
import { getFlag } from 'src/utils/feature-flags.util';

@Injectable()
export class SPKService {
  constructor(
    @InjectRepository(SPK)
    private spkRepository: Repository<SPK>,
    @InjectRepository(SPKInhouseTeam)
    private spkInhouseTeamRepository: Repository<SPKInhouseTeam>,
    @InjectRepository(SPKCostEvidence)
    private spkCostEvidenceRepository: Repository<SPKCostEvidence>,
    @InjectRepository(SPKCategory)
    private spkCategoryRepository: Repository<SPKCategory>,
    @InjectRepository(SPKSubCategory)
    private spkSubCategoryRepository: Repository<SPKSubCategory>,
    private activityLogService: ActivityLogService,
    private fileService: FilesService,
    private userService: UsersService,
  ) { }

  async create(
    createSPKDTO: CreateSPKDTO,
    user_id: number,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    //Create SPK rules, max spk need evidence <= 3
    const activeSPKCount = await getManager().query(
      `SELECT
        spk.ID
      FROM
        spk
      WHERE
        spk.status = 4
        AND spk.pay_to_user_id = $1
        AND spk.deleted_at IS NULL
				AND spk.created_at >= '2024-03-01 00:00:00'`,
      [createSPKDTO.pay_to_user_id],
    );

    if (activeSPKCount && activeSPKCount.length >= 2) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Terdapat lebih dari 2 BOP aktif, segera selesaikan BOP tersebut',
      );
    }

    const distanceToSitePhoto = files.find((e) => {
      return e.fieldname == 'distance_to_site_photo';
    });
    const kmRangeStartPhoto = files.find((e) => {
      return e.fieldname == 'km_range_start_photo';
    });
    const kmRangeEndPhoto = files.find((e) => {
      return e.fieldname == 'km_range_end_photo';
    });
    const kmBackToOfficePhoto = files.find((e) => {
      return e.fieldname == 'km_back_to_office_photo';
    });

    if (distanceToSitePhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        distanceToSitePhoto,
        user_id,
        FilePath.SPK_SITE_DISTANCE,
        'Distance To Site',
      );

      createSPKDTO.distance_to_site_photo = uploadedPhoto.id;
    }

    if (kmRangeStartPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmRangeStartPhoto,
        user_id,
        FilePath.SPK_KM_RANGE_START,
        'KM Range Start',
      );

      createSPKDTO.km_range_start_photo = uploadedPhoto.id;
    }

    if (kmRangeEndPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmRangeEndPhoto,
        user_id,
        FilePath.SPK_KM_RANGE_END,
        'KM Range End',
      );

      createSPKDTO.km_range_end_photo = uploadedPhoto.id;
    }

    if (kmBackToOfficePhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmBackToOfficePhoto,
        user_id,
        FilePath.SPK_BACK_TO_OFFICE,
        'Back To Office',
      );

      createSPKDTO.km_back_to_office_photo = uploadedPhoto.id;
    }

    //create SPK rules
    //1. SPK yang dibuat, diberikan waktu 2 hari untuk close, jika melebihi 2 hari, maka SPK tidak dapat dibuat untuk user "Pay To" tersebut kembali.
    // const activeSPKCount = await getManager().query(
    //   'SELECT created_at FROM spk WHERE pay_to_user_id = $1 AND status < 5 ORDER BY id ASC',
    //   [createSPKDTO.pay_to_user_id],
    // );

    // if (activeSPKCount && activeSPKCount.length > 0) {
    //   const currentDate = moment();
    //   const expiredDate = moment(
    //     activeSPKCount[0].created_at,
    //     'YYYY-MM-DD HH:mm:ss',
    //   );

    //   if (currentDate.diff(expiredDate, 'days') > 2) {
    //     throw failedResponse(
    //       HttpStatus.UNPROCESSABLE_ENTITY,
    //       'Terdapat SPK aktif melebihi 2 hari, segera selesaikan SPK tersebut',
    //     );
    //   }
    // }

    let maxBudgetBySite = await getManager().query(
      "SELECT SUM(line_amount * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
      [createSPKDTO.site_id],
    );
    maxBudgetBySite = maxBudgetBySite[0].sum
      ? Number(maxBudgetBySite[0].sum)
      : 0;

    let totalSPKAmount = await getManager().query(
      'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [createSPKDTO.site_id],
    );
    totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    let totalCashback = await getManager().query(
      'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [createSPKDTO.site_id],
    );
    totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    let totalCashout = await getManager().query(
      'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [createSPKDTO.site_id],
    );
    totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    const cashAdvance = Number(createSPKDTO.cash_advance);

    if (maxBudgetBySite < totalSPKAmount + cashAdvance) {
      createSPKDTO.status = SPKStatus.CREATED_OVER_BUDGET;
      createSPKDTO.is_over_budget = true;
    } else {
      createSPKDTO.status = SPKStatus.CREATED;
      createSPKDTO.is_over_budget = false;
    }

    createSPKDTO.created_by = user_id;

    let spk = await this.spkRepository.save(
      this.spkRepository.create(createSPKDTO),
    );

    const inhouseTeam = [];
    for (const i of createSPKDTO.inhouse_team_user_id) {
      const team = new SPKInhouseTeam();
      team.user_id = i;
      team.spk_id = spk.id;
      inhouseTeam.push(team);
    }

    await this.spkInhouseTeamRepository.insert(inhouseTeam);

    spk = await this.findOne({ id: spk.id });

    await this.activityLogService.create({
      user_id: user_id,
      description: `Melakukan Penambahan BOP dengan nomor ${spk.spk_number}`,
      ip: ip,
    });

    return spk;
  }

  async update(
    id: number,
    updateSPKDTO: UpdateSPKDTO,
    user: User,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
      );
    }

    const currentUser = await this.userService.findOneFull({ id: user.id });

    if (
      exists.status >= SPKStatus.APPROVED &&
      currentUser.employeePosition?.code != RoleEnum.SUPERADMIN
    ) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak bisa diedit!',
      );
    }

    const distanceToSitePhoto = files.find((e) => {
      return e.fieldname == 'distance_to_site_photo';
    });
    const kmRangeStartPhoto = files.find((e) => {
      return e.fieldname == 'km_range_start_photo';
    });
    const kmRangeEndPhoto = files.find((e) => {
      return e.fieldname == 'km_range_end_photo';
    });
    const kmBackToOfficePhoto = files.find((e) => {
      return e.fieldname == 'km_back_to_office_photo';
    });

    if (distanceToSitePhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        distanceToSitePhoto,
        user.id,
        FilePath.SPK_SITE_DISTANCE,
        'Distance To Site',
      );

      updateSPKDTO.distance_to_site_photo = uploadedPhoto.id;
    }

    if (kmRangeStartPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmRangeStartPhoto,
        user.id,
        FilePath.SPK_KM_RANGE_START,
        'KM Range Start',
      );

      updateSPKDTO.km_range_start_photo = uploadedPhoto.id;
    }

    if (kmRangeEndPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmRangeEndPhoto,
        user.id,
        FilePath.SPK_KM_RANGE_END,
        'KM Range End',
      );

      updateSPKDTO.km_range_end_photo = uploadedPhoto.id;
    }

    if (kmBackToOfficePhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmBackToOfficePhoto,
        user.id,
        FilePath.SPK_BACK_TO_OFFICE,
        'KM Back To Office',
      );

      updateSPKDTO.km_back_to_office_photo = uploadedPhoto.id;
    }

    let maxBudgetBySite = await getManager().query(
      "SELECT SUM(line_amount * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
      [updateSPKDTO.site_id],
    );
    maxBudgetBySite = maxBudgetBySite[0].sum
      ? Number(maxBudgetBySite[0].sum)
      : 0;

    let totalSPKAmount = await getManager().query(
      'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [updateSPKDTO.site_id],
    );
    totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    let totalCashback = await getManager().query(
      'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [updateSPKDTO.site_id],
    );
    totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    let totalCashout = await getManager().query(
      'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [updateSPKDTO.site_id],
    );

    totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    const cashAdvance = Number(updateSPKDTO.cash_advance);

    if (exists.status < SPKStatus.APPROVED) {
      if (maxBudgetBySite < totalSPKAmount + cashAdvance) {
        updateSPKDTO.status = SPKStatus.CREATED_OVER_BUDGET;
        updateSPKDTO.is_over_budget = true;
      } else {
        updateSPKDTO.status = SPKStatus.CREATED;
        updateSPKDTO.is_over_budget = false;
      }
    } else {
      // Preserve existing budget flag if it's already approved to prevent ghost states
      updateSPKDTO.is_over_budget = maxBudgetBySite < totalSPKAmount + cashAdvance;
    }

    if (currentUser.employeePosition?.grant_all_access === false) {
      delete updateSPKDTO.remark_superadmin;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inhouse_team_user_id, ...updatedDataSPK } = updateSPKDTO;

    await this.spkRepository.update(id, {
      ...(updatedDataSPK as any),
    });

    //update inhouse team
    if (
      updateSPKDTO.inhouse_team_user_id &&
      updateSPKDTO.inhouse_team_user_id.length > 0
    ) {
      const inhouseTeam = [];
      //check new or recent inhouse team users
      for (const i of updateSPKDTO.inhouse_team_user_id) {
        if (!exists.inhouse_team.find((e) => e.userInhouse.id == i)) {
          const team = new SPKInhouseTeam();
          team.user_id = i;
          team.spk_id = id;
          inhouseTeam.push(team);
        }
      }

      const deletedInhouseTeam = [];
      //check deleted inhouse team
      for (const i of exists.inhouse_team) {
        if (
          !updateSPKDTO.inhouse_team_user_id.find((e) => e == i.userInhouse.id)
        ) {
          deletedInhouseTeam.push(i.id);
        }
      }

      if (inhouseTeam.length > 0) {
        await this.spkInhouseTeamRepository.insert(inhouseTeam);
      }

      if (deletedInhouseTeam.length > 0) {
        await this.spkInhouseTeamRepository.softDelete(deletedInhouseTeam);
      }
    }

    await this.activityLogService.create({
      user_id: user.id,
      description: `Mengupdate Data BOP dengan nomor ${exists.spk_number}`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async findManyWithPagination(
    paginationOptions: IPaginationOptions,
    user: User,
    mobile: boolean,
  ) {

    const data = this.spkRepository
      .createQueryBuilder('spk')
      .withDeleted()
      .leftJoinAndSelect('spk.po', 'po', 'po.deleted_at IS NULL')
      .leftJoinAndSelect('po.project', 'project', 'project.deleted_at IS NULL')
      .leftJoinAndSelect('po.customer', 'customer')
      .leftJoinAndSelect('spk.customer', 'spkCustomer')
      .leftJoinAndSelect('spk.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect('spk.site', 'site', 'site.deleted_at IS NULL')
      .leftJoinAndSelect(
        'spk.cost_evidences',
        'cost_evidences',
        'cost_evidences.deleted_at IS NULL',
      )
      .leftJoinAndSelect('spk.region', 'region', 'region.deleted_at IS NULL');

    // Add total spk cash advance for over-budget calculation in UI (for all roles)
    data.addSelect(
      'total_cash_advance.total_cash_advance',
      'spk_total_cash_advance',
    );
    data.addSelect('total_cashback.total_cashback', 'spk_total_cashback');
    data.addSelect('total_cashout.total_cashout', 'spk_total_cashout');
    data.leftJoin(
      (qb) => {
        return qb
          .select('s.site_id')
          .addSelect('SUM(s.cash_advance)', 'total_cash_advance')
          .from(SPK, 's')
          .where('s.deleted_at IS NULL')
          .groupBy('s.site_id');
      },
      'total_cash_advance',
      '"total_cash_advance"."s_site_id" = spk.site_id',
    );
    data.leftJoin(
      (qb) => {
        return qb
          .select('s.site_id')
          .addSelect('SUM(s.cashback)', 'total_cashback')
          .from(SPK, 's')
          .where('s.deleted_at IS NULL')
          .groupBy('s.site_id');
      },
      'total_cashback',
      '"total_cashback"."s_site_id" = spk.site_id',
    );
    data.leftJoin(
      (qb) => {
        return qb
          .select('s.site_id')
          .addSelect('SUM(s.cashout)', 'total_cashout')
          .from(SPK, 's')
          .where('s.deleted_at IS NULL')
          .groupBy('s.site_id');
      },
      'total_cashout',
      '"total_cashout"."s_site_id" = spk.site_id',
    );

    // Add total po budget / unit price
    data.addSelect(
      'total_unit_price.total_unit_price',
      'spk_total_po_unit_price',
    );
    data.leftJoin(
      (qb) => {
        return qb
          .select('p.site_id')
          .addSelect(
            'SUM(p.unit_price * p.budget_percentage / 100)',
            'total_unit_price',
          )
          .from(PurchaseOrder, 'p')
          .where("p.status NOT ILIKE '%cancel%'")
          .groupBy('p.site_id');
      },
      'total_unit_price',
      '"total_unit_price"."p_site_id" = spk.site_id',
    );

    const currentUser = await this.userService.findOneFull({ id: user.id });


    let filterRegion = true;

    if (mobile === true) {
      filterRegion = false;

      data.leftJoinAndSelect(
        'spk.inhouse_team',
        'inhouse_team',
        'inhouse_team.deleted_at IS NULL',
      );

      data.andWhere(
        new Brackets((qb) => {
          qb.where('inhouse_team.user_id = :inHouseUserId', {
            inHouseUserId: user.id,
          })
            .orWhere('spk.created_by = :createdBy', { createdBy: user.id })
            .orWhere('spk.pay_to_user_id = :payToUserId', {
              payToUserId: user.id,
            });
        }),
      );
    } else {
      if (
        currentUser.employeePosition?.code != RoleEnum.PM &&
        currentUser.employeePosition?.code != RoleEnum.SUPERADMIN
      ) {
        data.where('spk.deleted_at IS NULL');
      }

      if (currentUser.employeePosition?.code == RoleEnum.PM) {

        data.andWhere(
          new Brackets((qb) => {
            qb.where(
              '(COALESCE(total_cash_advance.total_cash_advance, 0) - COALESCE(total_cashback.total_cashback, 0) + COALESCE(total_cashout.total_cashout, 0)) > COALESCE(total_unit_price.total_unit_price, 0)',
            ).orWhere('spk.is_over_budget = true');
          }),
        );

        data.andWhere('spk.status >= :status', {
          status: SPKStatus.APPROVED,
        });

        data.withDeleted();
      } else if (
        currentUser.employeePosition?.code == RoleEnum.RPM ||
        currentUser.employeePosition?.id == 9 ||
        currentUser.employee_position_id == 9
      ) {
        if (
          !paginationOptions.status ||
          paginationOptions.status < SPKStatus.CREATED
        ) {
          data.andWhere('spk.status >= :status', {
            status: SPKStatus.CREATED,
          });
        }
      } else if (
        currentUser.employeePosition?.code == RoleEnum.ADMINPAYMENT ||
        currentUser.employeePosition?.code == RoleEnum.ADMINPAYMENTREGION
      ) {
        if (
          !paginationOptions.status ||
          paginationOptions.status < SPKStatus.CREATED
        ) {
          data.andWhere('spk.status >= :status', {
            status: SPKStatus.CREATED,
          });
        }
      } else if (currentUser.employeePosition?.code == RoleEnum.VERIFICATOR) {
        if (
          !paginationOptions.status ||
          paginationOptions.status < SPKStatus.APPROVED
        ) {
          data.andWhere('spk.status >= :status', {
            status: SPKStatus.PAID,
          });
        }
      } else if (
        currentUser.employeePosition?.code == RoleEnum.SUPERADMIN ||
        currentUser.employeePosition?.code == RoleEnum.PO_ADMIN ||
        currentUser.employeePosition?.id == 10
      ) {
        if (currentUser.employeePosition?.code == RoleEnum.SUPERADMIN) {
          data.withDeleted();
        } else {
          data.where('spk.deleted_at IS NULL');
        }
      } else {
        filterRegion = false;

        data.leftJoinAndSelect(
          'spk.inhouse_team',
          'inhouse_team',
          'inhouse_team.deleted_at IS NULL',
        );

        data.andWhere(
          new Brackets((qb) => {
            qb.where('inhouse_team.user_id = :inHouseUserId', {
              inHouseUserId: user.id,
            })
              .orWhere('spk.created_by = :createdBy', { createdBy: user.id })
              .orWhere('spk.pay_to_user_id = :payToUserId', {
                payToUserId: user.id,
              });
          }),
        );
      }
    }

    if (
      currentUser.employeePosition?.code != RoleEnum.SUPERADMIN &&
      filterRegion === true
    ) {
      //filtering by user region if not user admin
      if (currentUser.gm_region) {
        let reg = currentUser.gm_region.split(',');

        let canAccessAll = false;

        reg = reg.map((str) => {
          const trimmed = str.trim().toLowerCase();
          if (trimmed == 'national') {
            canAccessAll = true;
          }
          return trimmed;
        });

        if (!canAccessAll) {
          data.andWhere('TRIM(LOWER(region.name)) IN (:...filterRegion)', {
            filterRegion: reg,
          });
        }
      }
    }

    if (paginationOptions.projects) {
      let projectNames: string[] = [];
      const projectsArr = Array.isArray(paginationOptions.projects) 
        ? paginationOptions.projects 
        : [paginationOptions.projects];
      
      for (const p of projectsArr) {
        if (p && typeof p === 'string') {
          projectNames.push(...p.split(',').map(name => name.trim().toLowerCase()));
        }
      }
      
      if (projectNames.length > 0) {
        data.andWhere(new Brackets((qb) => {
          qb.where('TRIM(LOWER(project.name)) IN (:...projectNames)', { projectNames })
            .orWhere('TRIM(LOWER(customer.name)) IN (:...projectNames)', { projectNames })
            .orWhere('TRIM(LOWER(spkCustomer.name)) IN (:...projectNames)', { projectNames });
        }));
      }
    }

    if (paginationOptions.regions) {
      let regionIds: string[] = [];
      const regionsArr = Array.isArray(paginationOptions.regions)
        ? paginationOptions.regions
        : [paginationOptions.regions];
      
      for (const r of regionsArr) {
        if (r && typeof r === 'string') {
          regionIds.push(...r.split(',').map(id => id.trim()));
        }
      }
      
      if (regionIds.length > 0) {
        data.andWhere('region.id IN (:...regionIds)', { regionIds });
      }
    }

    if (
      currentUser.employeePosition?.code == RoleEnum.PM &&
      !paginationOptions.status
    ) {
      // Default filter for PM: show items that are 'APPROVED' and 'OVER BUDGET'
      data.andWhere('spk.status = :status', { status: SPKStatus.APPROVED });
      data.andWhere('spk.is_over_budget = true');
    }


    if (paginationOptions.search) {
      const search = paginationOptions.search;

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
        data.andWhere('po.id IN (:...ids)', { ids: extractedIds });

      } else if (search.includes(',')) {
        // Priority 2: If commas exist, search by a list of exact "No BOP" numbers
        const spkNumbers = search.split(',').map(item => item.trim());
        data.andWhere('spk.spk_number IN (:...spkNumbers)', { spkNumbers });

      } else {
        // Priority 3: Fallback to a single-term search on "No BOP" and "DU ID"
        data.andWhere(
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


    if (paginationOptions.biosron_id) {
      // This regex extracts the numeric ID from the formatted Biosron ID string 
      // (e.g., gets "123" from "2024BSN-0708-123")
      const uniqueIdRegex = /^\d{4}BSN-\d{4}-(\d+)$/;
      const match = String(paginationOptions.biosron_id).match(uniqueIdRegex);

      if (match) {
        const purchaseOrderId = match[1];
        // Since the query already joins the 'po' table, we can filter by its ID.
        data.andWhere('po.id = :purchaseOrderId', { purchaseOrderId });
      }
    }

    if (paginationOptions.start_date) {
      data.andWhere('spk.created_at >= :start_date', {
        start_date: `${paginationOptions.start_date}`,
      });
    }

    if (paginationOptions.end_date) {
      const eDate = String(paginationOptions.end_date);
      const parsedEndDate = eDate.length === 10 ? `${eDate} 23:59:59` : eDate;
      data.andWhere('spk.created_at <= :end_date', {
        end_date: parsedEndDate,
      });
    }

    if (paginationOptions.pay_to_name) {
      const names = paginationOptions.pay_to_name.split(',').map(n => n.trim()).filter(Boolean);
      if (names.length === 1) {
        data.andWhere('pay_to_user.name ILIKE :payToName', {
          payToName: `%${names[0]}%`,
        });
      } else if (names.length > 1) {
        data.andWhere('pay_to_user.name IN (:...payToNames)', { payToNames: names });
      }
    }

    if (paginationOptions.status) {
      const stat = paginationOptions.status;
      if (stat == SPKStatus.APPROVED) {
        data.andWhere(
          new Brackets((qb) => {
            qb.where(
              new Brackets((qb2) => {
                qb2
                  .where('spk.status = :status', {
                    status: SPKStatus.APPROVED,
                  })
                  .andWhere('spk.is_over_budget = false');
              }),
            ).orWhere('spk.status = :status3', {
              status3: SPKStatus.APPROVED_OVER_BUDGET,
            });
          }),
        );
      } else if (stat == SPKStatus.WAITING_APPROVAL_PM) {
        data.andWhere('spk.status = :status', {
          status: SPKStatus.APPROVED,
        });
        data.andWhere('spk.is_over_budget = true');
      } else if (stat == SPKStatus.PAID) {
        data.andWhere('spk.status = :status', {
          status: SPKStatus.PAID,
        });
        data.andWhere('cost_evidences.id IS NOT NULL');
      } else if (stat == SPKStatus.PAID_NEED_EVIDENCE) {
        data.andWhere('spk.status = :status', {
          status: SPKStatus.PAID,
        });
        data.andWhere('cost_evidences.id IS NULL');
      } else if (
        stat == SPKStatus.CREATED ||
        stat == SPKStatus.CREATED_OVER_BUDGET
      ) {
        data.andWhere(
          new Brackets((qb) => {
            qb.where('spk.status = :status', {
              status: SPKStatus.CREATED,
            }).orWhere('spk.status = :status3', {
              status3: SPKStatus.CREATED_OVER_BUDGET,
            });
          }),
        );
      } else {
        data.andWhere('spk.status = :status', {
          status: stat,
        });
      }
    }

    data.orderBy('spk.created_at', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    console.log('[DEBUG] SPK List Query executed for user:', user.id, 'Role Code:', currentUser.employeePosition?.code);
    console.log('[DEBUG] SPK List SQL Query:', data.getSql());
    console.log('[DEBUG] SPK List Parameters:', data.getParameters());
    
    (paginationOptions as any).sql_debug = data.getSql();
    (paginationOptions as any).sql_params = data.getParameters();
    
    const returnedData = await data.getMany();

    return infinityPagination(returnedData, SPKResource, paginationOptions);
  }

  async findOne(fields: EntityCondition<SPK>, user?: User) {
    const data = await this.spkRepository
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
      .leftJoinAndSelect(
        'spk.inhouse_team',
        'inhouse_team',
        'inhouse_team.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'spk.customer',
        'customer',
        'customer.deleted_at IS NULL',
      )
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .leftJoinAndSelect(
        'userInhouse.employeePosition',
        'employeePosition',
        'employeePosition.deleted_at IS NULL',
      )
      .leftJoinAndSelect('spk.distance_to_site_file', 'distance_to_site_file')
      .leftJoinAndSelect('spk.km_range_start_file', 'km_range_start_file')
      .leftJoinAndSelect('spk.km_range_end_file', 'km_range_end_file')
      .leftJoinAndSelect('spk.km_back_to_office_file', 'km_back_to_office_file')
      .leftJoinAndSelect('spk.check_in_file', 'check_in_file')
      .leftJoinAndSelect('spk.check_out_file', 'check_out_file')
      .leftJoinAndSelect('spk.transfer_proof_file', 'transfer_proof_file')
      .leftJoinAndSelect(
        'spk.cost_evidences',
        'cost_evidences',
        'cost_evidences.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'cost_evidences.cost_evidence_photo_file',
        'cost_evidence_photo_file',
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
      )
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
      );
    }

    if (user) {
      const currentUser = await this.userService.findOneFull({ id: user.id });
      if (currentUser.employeePosition?.grant_all_access === true) {
        return SPKResourceDetail(data, data.remark_superadmin);
      }
    }

    return SPKResourceDetail(data);
  }

  async findOneFull(fields: EntityCondition<SPK>) {
    const data = await this.spkRepository
      .createQueryBuilder('spk')
      .leftJoinAndSelect('spk.inhouse_team', 'inhouse_team')
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .where(fields)
      .getOne();

    return data;
  }

  async updateCICOPhoto(
    id: number,
    user: User,
    ip: string,
    totalRange: string,
    files: Array<Express.Multer.File>,
  ) {
    if (!files) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      this.deleteFiles(files);
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
      );
    }
    const kmRangeStartPhoto = files.find((e) => {
      return e.fieldname == 'km_range_start_photo';
    });
    const kmRangeEndPhoto = files.find((e) => {
      return e.fieldname == 'km_range_end_photo';
    });
    const checkInPhoto = files.find((e) => {
      return e.fieldname == 'check_in_photo';
    });
    const checkOutPhoto = files.find((e) => {
      return e.fieldname == 'check_out_photo';
    });
    const kmBackToOfficePhoto = files.find((e) => {
      return e.fieldname == 'km_back_to_office_photo';
    });

    const updateData = {};

    if (kmRangeStartPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmRangeStartPhoto,
        user.id,
        FilePath.SPK_KM_RANGE_START,
        'KM Range Start',
      );

      updateData['km_range_start_photo'] = uploadedPhoto.id;
    }

    if (kmRangeEndPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmRangeEndPhoto,
        user.id,
        FilePath.SPK_KM_RANGE_END,
        'KM Range End',
      );

      updateData['km_range_end_photo'] = uploadedPhoto.id;
    }

    if (kmBackToOfficePhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        kmBackToOfficePhoto,
        user.id,
        FilePath.SPK_BACK_TO_OFFICE,
        'Back To Office',
      );

      updateData['km_back_to_office_photo'] = uploadedPhoto.id;
    }

    if (checkInPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        checkInPhoto,
        user.id,
        FilePath.SPK_CHECK_IN,
        'Check In',
      );

      updateData['check_in_photo'] = uploadedPhoto.id;
    }

    if (checkOutPhoto) {
      const uploadedPhoto = await this.fileService.uploadFile(
        checkOutPhoto,
        user.id,
        FilePath.SPK_CHECK_OUT,
        'Check Out',
      );

      updateData['check_out_photo'] = uploadedPhoto.id;
    }

    if (totalRange) {
      updateData['total_range'] = totalRange;
    }

    await this.spkRepository.update(id, updateData);

    return updateData;
  }

  async updateSettlement(
    id: number,
    updateSPKSettlementDTO: UpdateSPKSettlementDTO,
    user: User,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
      );
    }

    const currentUser = await this.userService.findOneFull({ id: user.id });

    if (
      updateSPKSettlementDTO.status == SPKStatus.PAID &&
      !currentUser.employeePosition?.roleAccess.some(function (e) {
        return e.menu.name == MenuPermission.SPK_KASBON_SETTLEMENT;
      }) &&
      currentUser.employeePosition?.grant_all_access == false &&
      currentUser.employeePosition?.id != 61
    ) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Role ini tidak dapat mengubah status menjadi Paid',
      );
    } else if (
      updateSPKSettlementDTO.status == SPKStatus.CLOSED &&
      !currentUser.employeePosition?.roleAccess.some(function (e) {
        return e.menu.name == MenuPermission.SPK_KASBON_SETTLEMENT_CLOSE;
      }) &&
      currentUser.employeePosition?.grant_all_access == false &&
      currentUser.employeePosition?.id != 61
    ) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Role ini tidak dapat mengubah status menjadi Closed',
      );
    } else if (
      updateSPKSettlementDTO.status == SPKStatus.PAID &&
      exists.status >= SPKStatus.PAID
    ) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK yang sudah dibayar tidak bisa dibayar kembali',
      );
    } else if (
      updateSPKSettlementDTO.status == SPKStatus.CLOSED &&
      exists.status >= SPKStatus.CLOSED
    ) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK yang sudah closed tidak bisa diclose kembali',
      );
    }

    let maxBudgetBySite = await getManager().query(
      "SELECT SUM(line_amount * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
      [exists.site_id],
    );

    maxBudgetBySite = maxBudgetBySite[0].sum
      ? Math.round(Number(maxBudgetBySite[0].sum))
      : 0;

    let totalSPKAmount = await getManager().query(
      'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [exists.site_id],
    );
    totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    let totalCashback = await getManager().query(
      'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [exists.site_id],
    );
    totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    let totalCashout = await getManager().query(
      'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [exists.site_id],
    );
    totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    if (
      totalSPKAmount > maxBudgetBySite &&
      exists.status < SPKStatus.APPROVED_OVER_BUDGET
    ) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `SPK over budget belum diapprove`,
      );
    }

    const deltaOfSettlement =
      exists.cash_advance - updateSPKSettlementDTO.operation_cost;

    let cashback = 0;
    let cashout = 0;

    if (deltaOfSettlement < 0) {
      cashout = Math.abs(deltaOfSettlement);
    } else {
      cashback = deltaOfSettlement;
    }

    const updateData = {
      operation_cost: updateSPKSettlementDTO.operation_cost,
      paid_by: exists.paid_by,
      closed_by: exists.closed_by,
      remark_admin: exists.remark_admin,
      remark_verificator: exists.remark_verificator,
      delta_of_settlement: deltaOfSettlement,
      cashback: cashback,
      cashout: cashout,
      status: updateSPKSettlementDTO.status,
    };

    if (updateSPKSettlementDTO.status == SPKStatus.PAID) {
      updateData['paid_date'] = moment().format('YYYY-MM-DD HH:mm:ss');
      updateData.paid_by = user.id;
      updateData.remark_admin = updateSPKSettlementDTO.remarks;
    } else if (updateSPKSettlementDTO.status == SPKStatus.CLOSED) {
      updateData['closing_date'] = moment().format('YYYY-MM-DD HH:mm:ss');
      updateData.closed_by = user.id;
      updateData.remark_verificator = updateSPKSettlementDTO.remarks;
    }

    const transferProofFile = files.find((e) => {
      return e.fieldname == 'transfer_proof_photo';
    });

    if (transferProofFile) {
      const uploadedPhoto = await this.fileService.uploadFile(
        transferProofFile,
        user.id,
        FilePath.SPK_TRANSFER_PROOF,
        'Transfer Proof',
      );

      updateData['transfer_proof_photo'] = uploadedPhoto.id;
    }

    await this.spkRepository.update(id, updateData);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Mengupdate Data Settlement BOP dengan nomor ${exists.spk_number}`,
      ip: ip,
    });
  }

  async updateCostEvidence(
    spkId: number,
    user: User,
    ip: string,
    id: number[],
    name: string[],
    cost: number[],
    files: Array<Express.Multer.File>,
    deleted_id: number[],
  ) {
    const exists = await this.findOneFull({ id: spkId });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
      );
    }

    if (deleted_id) {
      await this.spkCostEvidenceRepository.softDelete(deleted_id);
    }

    if (id || name || cost) {
      if (name.length != cost.length || id.length != cost.length) {
        this.deleteFiles(files);
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          `Jumlah data tidak sesuai`,
        );
      }

      const insertData = [];
      const updateData = [];

      for (const [index, e] of id.entries()) {
        const data = {
          spk_id: spkId,
          name: name[index],
          cost: cost[index],
        };

        const file = files.find(
          (e) => e.fieldname == `evidence_photo[${index}]`,
        );

        if (!e && !file) {
          this.deleteFiles(files);
          throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan foto!');
        }

        if (file) {
          const uploadedPhoto = await this.fileService.uploadFile(
            file,
            user.id,
            FilePath.SPK_COST_EVIDENCE,
            'Cost Evidence',
          );
          data['photo'] = uploadedPhoto.id;
        }

        if (e) {
          data['id'] = e;
          updateData.push(data);
        } else {
          insertData.push(data);
        }
      }

      if (insertData.length > 0) {
        await this.spkCostEvidenceRepository.insert(insertData);
      }

      if (updateData.length > 0) {
        for (const data of updateData) {
          await this.spkCostEvidenceRepository.update(data.id, data);
        }
      }

      await this.activityLogService.create({
        user_id: user.id,
        description: `Mengupdate Data Settlement dengan nomor ${exists.spk_number}`,
        ip: ip,
      });
    }
  }

  deleteFiles(files: Array<Express.Multer.File>) {
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    const existingSPK = await this.spkRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status >= SPKStatus.PAID) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak bisa dihapus!`);
    }

    await this.spkRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data BOP dengan nomor ${existingSPK.spk_number}`,
      ip: ip,
    });

    return null;
  }

  async approveOverBudget(
    id: number,
    user: User,
    remark: string,
  ): Promise<void> {
    const existingSPK = await this.spkRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status < SPKStatus.APPROVED) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `SPK harus diapprove oleh RPM terlebih dahulu!`,
      );
    } else if (existingSPK.status >= SPKStatus.APPROVED_OVER_BUDGET) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `SPK tidak dapat diapprove kembali!`,
      );
    }

    let maxBudgetBySite = await getManager().query(
      "SELECT SUM(line_amount * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
      [existingSPK.site_id],
    );

    maxBudgetBySite = maxBudgetBySite[0].sum
      ? Math.round(Number(maxBudgetBySite[0].sum))
      : 0;

    let totalSPKAmount = await getManager().query(
      'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [existingSPK.site_id],
    );
    totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    let totalCashback = await getManager().query(
      'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [existingSPK.site_id],
    );
    totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    let totalCashout = await getManager().query(
      'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
      [existingSPK.site_id],
    );
    totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    if (
      totalSPKAmount <= maxBudgetBySite &&
      !existingSPK.is_over_budget
    ) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK belum over budget`);
    }

    await this.spkRepository.update(id, {
      status: SPKStatus.APPROVED_OVER_BUDGET,
      approved_over_budget_by: user.id,
      remark_pm: remark,
    });

    return null;
  }

  async approve(id: number, user: User, remark: string, workload_ticket_id?: number): Promise<void> {
    const existingSPK = await this.spkRepository.findOne(id, { relations: ['po'] });
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status >= SPKStatus.APPROVED) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `SPK tidak dapat diapprove kembali!`,
      );
    }

    const requireWorkloadTicket = getFlag('require_workload_ticket');
    const cutoffDate = new Date('2026-06-28T00:00:00Z');
    const isLegacySpk = existingSPK.created_at && new Date(existingSPK.created_at) < cutoffDate;
    
    if (existingSPK.po && requireWorkloadTicket && !isLegacySpk) {
      if (!existingSPK.po.workload_ticket_id && !workload_ticket_id) {
        throw failedResponse(HttpStatus.BAD_REQUEST, `Workload ticket required for this PO`);
      }
      if (workload_ticket_id && !existingSPK.po.workload_ticket_id) {
        await getManager().update(PurchaseOrder, existingSPK.po.id, { workload_ticket_id });
      }
    }

    await this.spkRepository.update(id, {
      status: SPKStatus.APPROVED,
      approved_by: user.id,
      remark_rpm: remark,
    });

    return null;
  }

  async reject(id: number, user: User, remark: string): Promise<void> {
    const existingSPK = await this.spkRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (
      existingSPK.status == SPKStatus.CREATED ||
      existingSPK.status == SPKStatus.CREATED_OVER_BUDGET
    ) {
      await this.spkRepository.update(id, {
        status: SPKStatus.REJECTED,
        approved_by: user.id,
        remark_rpm: remark,
      });

      return null;
    }

    throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak dapat direject!`);
  }

  async rejectOverBudget(
    id: number,
    user: User,
    remark: string,
  ): Promise<void> {
    const existingSPK = await this.spkRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status == SPKStatus.APPROVED) {
      await this.spkRepository.update(id, {
        status: SPKStatus.REJECTED,
        approved_by: user.id,
        remark_rpm: remark,
      });

      return null;
    }

    throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak dapat direject!`);
  }

  // Add this entire function inside the SPKService class

  // In spk.service.ts
  // Replace your existing approveMany function with this one

  async approveMany(ids: number[], user: User, ip: string, workload_ticket_id?: number): Promise<any> {
    if (!ids || ids.length === 0) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'No items selected for approval.');
    }

    const currentUser = await this.userService.findOneFull({ id: user.id });
    const menus = currentUser.employeePosition?.roleAccess?.map(ra => ra.menu?.name) || [];
    const isSuperadmin = currentUser.employeePosition?.grant_all_access === true;
    const hasRPMMenu = menus.includes('spk_approve');
    const hasPMMenu = menus.includes('spk_over_budget');

    // Use a simpler query builder first to fetch the selected items, then filter them in code 
    // to avoid TypeORM parameter binding bugs with whereInIds + andWhere.
    const itemsToApproveAll = await this.spkRepository.createQueryBuilder('spk')
      .where('spk.id IN (:...ids)', { ids })
      .leftJoinAndSelect('spk.po', 'po')
      .getMany();

    if (itemsToApproveAll.length === 0) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'Selected items not found in database.');
    }

    const validItems = [];
    let isPMApproval = false;
    let isRPMApproval = false;

    for (const item of itemsToApproveAll) {
      const isRPMTarget = item.status === SPKStatus.CREATED || item.status === SPKStatus.CREATED_OVER_BUDGET;
      const isPMTarget = item.status === SPKStatus.APPROVED && Boolean(item.is_over_budget) === true;

      if ((hasRPMMenu || isSuperadmin) && isRPMTarget) {
        validItems.push(item);
        isRPMApproval = true;
      } else if ((hasPMMenu || isSuperadmin) && isPMTarget) {
        validItems.push(item);
        isPMApproval = true;
      }
    }

    if (validItems.length === 0) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'None of the selected items can be approved at their current status by your role.');
    }

    if (isRPMApproval && isPMApproval) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Cannot mix items that require RPM approval and PM approval in a single batch.');
    }

    const validIds = validItems.map(item => item.id);
    const updatePayload = isPMApproval
      ? { status: SPKStatus.APPROVED_OVER_BUDGET, approved_over_budget_by: user.id }
      : { status: SPKStatus.APPROVED, approved_by: user.id };

    const requireWorkloadTicket = getFlag('require_workload_ticket');
    const cutoffDate = new Date('2026-06-28T00:00:00Z');
    
    const queryRunner = getManager().connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of validItems) {
        const isLegacySpk = item.created_at && new Date(item.created_at) < cutoffDate;
        if (item.po && requireWorkloadTicket && !isLegacySpk) {
          if (!item.po.workload_ticket_id && !workload_ticket_id) {
             throw failedResponse(HttpStatus.BAD_REQUEST, `Workload ticket required for SPK ${item.spk_number}`, {
               requireWorkloadTicket: true,
               siteId: item.site_id,
               poId: item.po.id
             });
          }
          if (workload_ticket_id && !item.po.workload_ticket_id) {
             await queryRunner.manager.update(PurchaseOrder, item.po.id, { workload_ticket_id });
          }
        }
      }

      // Update only the valid items
      await queryRunner.manager.update(SPK, validIds, updatePayload);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Create a log entry
    await this.activityLogService.create({
      user_id: user.id,
      description: `Melakukan approve massal untuk BOP dengan ID: ${validIds.join(', ')}`,
      ip: ip,
    });

    return { approved_count: validIds.length, total_selected: ids.length };
  }

  async getAllSPKCategory(paginationOptions: IPaginationOptions) {
    const data = this.spkCategoryRepository.createQueryBuilder('spk_category');

    if (paginationOptions.search) {
      data.andWhere('spk_category.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('spk_category.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      SPKCategoryResource,
      paginationOptions,
    );
  }

  async getAllSPKSubCategory(paginationOptions: IPaginationOptions) {
    const data = this.spkSubCategoryRepository.createQueryBuilder('spk_subcategory');

    if (paginationOptions.search) {
      data.andWhere('spk_subcategory.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('spk_subcategory.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      SPKSubCategoryResource,
      paginationOptions,
    );
  }

  async generateReport(siteCodes: string[]): Promise<any> {
    if (!siteCodes || siteCodes.length === 0) {
      return [];
    }


    // Query ini dirancang untuk menggabungkan data dari beberapa tabel
    // dan melakukan kalkulasi yang kompleks langsung di database untuk efisiensi.
    const query = `
      SELECT
        s.code AS du_id,
        r.name AS region,
        COALESCE(STRING_AGG(DISTINCT p.name, ', '), 'N/A') AS project,
        COALESCE(STRING_AGG(DISTINCT po.item_description, ', '), 'N/A') AS po_line,
        COALESCE(po_summary.total_amount, 0) AS po_amount_total,
        COALESCE(spk_summary.total_cash_advance, 0) AS total_spk_amount,
        CASE
            WHEN po_summary.total_count IS NULL OR po_summary.total_count = 0 THEN 'No POs'
            WHEN po_summary.total_count = po_summary.closed_count THEN 'Closed'
            WHEN po_summary.closed_count = 0 THEN 'NY Closed'
            ELSE 'Partially closed'
        END AS po_status
      FROM
        sites s
      LEFT JOIN (
        -- Mengambil region dari salah satu SPK terkait site ini
        SELECT DISTINCT ON (site_id) site_id, region_id
        FROM spk WHERE deleted_at IS NULL
      ) AS spk_unique ON spk_unique.site_id = s.id
      LEFT JOIN regions r ON spk_unique.region_id = r.id AND r.deleted_at IS NULL
      LEFT JOIN purchase_orders po ON po.site_id = s.id AND po.deleted_at IS NULL
      LEFT JOIN projects p ON po.project_id = p.id AND p.deleted_at IS NULL
      LEFT JOIN (
          -- Subquery untuk menghitung total & status PO per site_id
          SELECT
              site_id,
              SUM(line_amount) AS total_amount,
              COUNT(*) AS total_count,
              COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_count
          FROM purchase_orders
          WHERE
              -- This line correctly excludes soft-deleted orders
              deleted_at IS NULL
              -- ================================================================= --
              -- ===== THIS LINE IS NOW CASE-INSENSITIVE ========================= --
              AND LOWER(status) <> 'cancelled'
              -- ================================================================= --
          GROUP BY site_id
      ) AS po_summary ON po_summary.site_id = s.id
      LEFT JOIN (
          -- Subquery untuk menghitung total cash advance dari SPK per site_id
          SELECT
              site_id,
              SUM(cash_advance) AS total_cash_advance
          FROM spk
          WHERE deleted_at IS NULL
          GROUP BY site_id
      ) AS spk_summary ON spk_summary.site_id = s.id
      WHERE
          s.code = ANY($1) -- Parameter binding untuk array siteCodes
      GROUP BY
          s.code, r.name, po_summary.total_amount, spk_summary.total_cash_advance, po_summary.total_count, po_summary.closed_count;
    `;

    // Menjalankan raw query menggunakan getManager
    const result = await getManager().query(query, [siteCodes]);
    return result;
  }




  // In spk.service.ts
  public async findDetailsBySiteCode(siteCode: string, user: any): Promise<any> {
    // Use 'find' to get all SPKs for the given site code
    const spkDetails = await this.spkRepository.find({
      // This 'where' clause searches on the related Site entity
      where: {
        site: {
          code: siteCode,
        },
      },
      relations: [
        'pay_to_user',
        'approved_by_user',
        'po',
        'po.customer',
        'site', // Include the site details in the response
        'region',
      ],
    });

    if (!spkDetails || spkDetails.length === 0) {
      throw new NotFoundException(`No SPK details found for Site Code ${siteCode}`);
    }

    // Since this returns an array, we can use the same detail resource on each item
    // Or create a new list resource if needed. For now, let's return the array.
    return spkDetails.map(spk => SPKResourceDetail(spk));
  }

  async getFilterOptions() {
    const regionsRaw = await this.spkRepository
      .createQueryBuilder('spk')
      .leftJoin('spk.region', 'region')
      .select(['region.id', 'region.name'])
      .where('spk.deleted_at IS NULL')
      .andWhere('region.id IS NOT NULL')
      .andWhere('region.deleted_at IS NULL')
      .distinct(true)
      .orderBy('region.name', 'ASC')
      .getRawMany();

    const regions = regionsRaw.map(r => ({
      id: r.region_id,
      name: r.region_name,
    }));

    const projectsRaw = await this.spkRepository
      .createQueryBuilder('spk')
      .leftJoin('spk.po', 'po')
      .leftJoin('po.project', 'project')
      .select(['project.name'])
      .where('spk.deleted_at IS NULL')
      .andWhere('po.deleted_at IS NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere("project.name IS NOT NULL AND project.name != ''")
      .distinct(true)
      .orderBy('project.name', 'ASC')
      .getRawMany();

    const customersRaw = await this.spkRepository
      .createQueryBuilder('spk')
      .leftJoin('spk.po', 'po')
      .leftJoin('po.customer', 'customer')
      .select(['customer.name'])
      .where('spk.deleted_at IS NULL')
      .andWhere('po.deleted_at IS NULL')
      .andWhere('customer.deleted_at IS NULL')
      .andWhere("customer.name IS NOT NULL AND customer.name != ''")
      .distinct(true)
      .orderBy('customer.name', 'ASC')
      .getRawMany();

    const projectsSet = new Set<string>();
    projectsRaw.forEach(p => projectsSet.add(p.project_name));
    customersRaw.forEach(c => projectsSet.add(c.customer_name));

    const projects = Array.from(projectsSet).sort().map(name => ({ name }));

    const payToUsersRaw = await this.spkRepository
      .createQueryBuilder('spk')
      .leftJoin('spk.pay_to_user', 'pay_to_user')
      .select(['pay_to_user.id', 'pay_to_user.name'])
      .where('spk.deleted_at IS NULL')
      .andWhere('pay_to_user.id IS NOT NULL')
      .andWhere("pay_to_user.name IS NOT NULL AND pay_to_user.name != ''")
      .distinct(true)
      .orderBy('pay_to_user.name', 'ASC')
      .getRawMany();

    const payToUsers = payToUsersRaw.map(u => ({
      id: u.pay_to_user_id,
      name: u.pay_to_user_name,
    }));

    return {
      regions,
      projects,
      pay_to_users: payToUsers,
    };
  }
}

