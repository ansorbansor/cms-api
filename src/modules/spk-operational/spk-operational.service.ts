import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, Repository, getManager } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { CreateSPKOperationalDTO } from './dto/create.spk-operational.dto';
import { UpdateSPKOperationalDTO } from './dto/update-spk-operational.dto';
import { FilesService } from '../files/files.service';
import { FilePath, MenuPermission, RoleEnum, SPKStatus } from 'src/utils/enums';
import { UpdateSPKOperationalSettlementDTO } from './dto/update-spk-operational-settlement.dto';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import * as fs from 'fs';
import moment from 'moment';
import {
  SPKOperationalResource,
  SPKOperationalResourceDetail,
} from './resources/spk-operational.resources';
import { UsersService } from '../users/users.service';
import { SPKOperational } from 'src/entities/spk-operationals.entity';
import { SPKOperationalInhouseTeam } from 'src/entities/spk-operational-inhouse-team.entity';
import { SPKOperationalCostEvidence } from 'src/entities/spk-operationals.cost-evidence.entity';
import appConfig from 'src/config/app.config';

@Injectable()
export class SPKOperationalService {
  constructor(
    @InjectRepository(SPKOperational)
    private spkOperationalRepository: Repository<SPKOperational>,
    @InjectRepository(SPKOperationalInhouseTeam)
    private spkOperationalInhouseTeamRepository: Repository<SPKOperationalInhouseTeam>,
    @InjectRepository(SPKOperationalCostEvidence)
    private spkOperaionalCostEvidenceRepository: Repository<SPKOperationalCostEvidence>,
    private activityLogService: ActivityLogService,
    private fileService: FilesService,
    private userService: UsersService,
  ) { }

  async create(
    createSPKDTO: CreateSPKOperationalDTO,
    user_id: number,
    ip: string,
  ) {
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

    //over budget rules
    // let maxBudgetBySite = await getManager().query(
    //   "SELECT SUM(unit_price * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
    //   [createSPKDTO.site_id],
    // );
    // maxBudgetBySite = maxBudgetBySite[0].sum
    //   ? Number(maxBudgetBySite[0].sum)
    //   : 0;

    // let totalSPKAmount = await getManager().query(
    //   'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [createSPKDTO.site_id],
    // );
    // totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    // let totalCashback = await getManager().query(
    //   'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [createSPKDTO.site_id],
    // );
    // totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    // let totalCashout = await getManager().query(
    //   'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [createSPKDTO.site_id],
    // );
    // totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    // totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    //Create SPK rules, max spk need evidence <= 3
    const activeSPKCount = await getManager().query(
      `SELECT
        spk_operationals.ID
      FROM
        spk_operationals
      WHERE
        spk_operationals.status = 4
        AND spk_operationals.pay_to_user_id = $1
        AND spk_operationals.deleted_at IS NULL
				AND spk_operationals.created_at >= '2024-03-01 00:00:00'`,
      [createSPKDTO.pay_to_user_id],
    );

    if (activeSPKCount && activeSPKCount.length >= 2) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Terdapat lebih dari 2 Pengeluaran Kantor aktif, segera selesaikan Pengeluaran Kantor tersebut',
      );
    }

    const cashAdvance = Number(createSPKDTO.cash_advance);

    if (appConfig().spkOperationMaxBudget > cashAdvance) {
      createSPKDTO.status = SPKStatus.CREATED;
      createSPKDTO.is_over_budget = false;
    } else {
      createSPKDTO.status = SPKStatus.CREATED_OVER_BUDGET;
      createSPKDTO.is_over_budget = true;
    }

    createSPKDTO.created_by = user_id;

    let spk = await this.spkOperationalRepository.save(
      this.spkOperationalRepository.create(createSPKDTO),
    );

    const inhouseTeam = [];
    for (const i of createSPKDTO.inhouse_team_user_id) {
      const team = new SPKOperationalInhouseTeam();
      team.user_id = i;
      team.spk_operational_id = spk.id;
      inhouseTeam.push(team);
    }

    await this.spkOperationalInhouseTeamRepository.insert(inhouseTeam);

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
    updateSPKDTO: UpdateSPKOperationalDTO,
    user: User,
    ip: string,
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
      currentUser.employeePosition.code != RoleEnum.SUPERADMIN
    ) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak bisa diedit!',
      );
    }

    //over budget rules
    // let maxBudgetBySite = await getManager().query(
    //   "SELECT SUM(unit_price * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
    //   [updateSPKDTO.site_id],
    // );
    // maxBudgetBySite = maxBudgetBySite[0].sum
    //   ? Number(maxBudgetBySite[0].sum)
    //   : 0;

    // let totalSPKAmount = await getManager().query(
    //   'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [updateSPKDTO.site_id],
    // );
    // totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    // let totalCashback = await getManager().query(
    //   'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [updateSPKDTO.site_id],
    // );
    // totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    // let totalCashout = await getManager().query(
    //   'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [updateSPKDTO.site_id],
    // );

    // totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    // totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    const cashAdvance = Number(updateSPKDTO.cash_advance);

    if (appConfig().spkOperationMaxBudget > cashAdvance) {
      updateSPKDTO.status = SPKStatus.CREATED;
      updateSPKDTO.is_over_budget = false;
    } else {
      updateSPKDTO.status = SPKStatus.CREATED_OVER_BUDGET;
      updateSPKDTO.is_over_budget = true;
    }

    if (currentUser.employeePosition?.grant_all_access === false) {
      delete updateSPKDTO.remark_superadmin;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inhouse_team_user_id, ...updatedDataSPK } = updateSPKDTO;

    await this.spkOperationalRepository.update(id, {
      ...updatedDataSPK,
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
          const team = new SPKOperationalInhouseTeam();
          team.user_id = i;
          team.spk_operational_id = id;
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
        await this.spkOperationalInhouseTeamRepository.insert(inhouseTeam);
      }

      if (deletedInhouseTeam.length > 0) {
        await this.spkOperationalInhouseTeamRepository.softDelete(
          deletedInhouseTeam,
        );
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
    const data = this.spkOperationalRepository
      .createQueryBuilder('spk-operational')
      .leftJoinAndSelect('spk-operational.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect('spk-operational.cost_evidences', 'cost_evidences')
      .leftJoinAndSelect('spk-operational.region', 'region')
      .leftJoinAndSelect('spk-operational.category', 'category')
      .leftJoinAndSelect('spk-operational.subcategory', 'subcategory')
      .leftJoinAndSelect('spk-operational.request_type', 'request_type');

    const currentUser = await this.userService.findOneFull({ id: user.id });
    let filterRegion = true;

    if (mobile === true) {
      filterRegion = false;

      data.leftJoinAndSelect('spk-operational.inhouse_team', 'inhouse_team');

      data.andWhere(
        new Brackets((qb) => {
          qb.where('inhouse_team.user_id = :inHouseUserId', {
            inHouseUserId: user.id,
          })
            .orWhere('spk-operational.created_by = :createdBy', {
              createdBy: user.id,
            })
            .orWhere('spk-operational.pay_to_user_id = :payToUserId', {
              payToUserId: user.id,
            });
        }),
      );
    } else {
      if (currentUser.employeePosition.code == RoleEnum.PM) {
        //add total po budget / unit price
        // data.addSelect(
        //   'total_unit_price.total_unit_price',
        //   'spk_total_po_unit_price',
        // );
        // data.leftJoin(
        //   (qb) => {
        //     return qb
        //       .select('p.site_id')
        //       .addSelect(
        //         'SUM(p.unit_price * p.budget_percentage / 100)',
        //         'total_unit_price',
        //       )
        //       .from(PurchaseOrder, 'p')
        //       .where("p.status NOT ILIKE '%cancel%'")
        //       .groupBy('p.site_id');
        //   },
        //   'total_unit_price',
        //   '"total_unit_price"."p_site_id" = spk.site_id',
        // );

        data.andWhere('spk-operational.cash_advance > :maxBudget', {
          maxBudget: appConfig().spkOperationMaxBudget,
        });

        data.andWhere('spk-operational.status >= :status', {
          status: SPKStatus.APPROVED,
        });

        data.withDeleted();
      } else if (currentUser.employeePosition.code == RoleEnum.RPM) {
        if (
          !paginationOptions.status ||
          paginationOptions.status < SPKStatus.CREATED
        ) {
          data.andWhere('spk-operational.status >= :status', {
            status: SPKStatus.CREATED,
          });
        }
      } else if (
        currentUser.employeePosition.code == RoleEnum.ADMINPAYMENT ||
        currentUser.employeePosition.code == RoleEnum.ADMINPAYMENTREGION
      ) {
        if (
          !paginationOptions.status ||
          paginationOptions.status < SPKStatus.APPROVED
        ) {
          data.andWhere('spk-operational.status >= :status', {
            status: SPKStatus.APPROVED,
          });
        }
      } else if (currentUser.employeePosition.code == RoleEnum.VERIFICATOR) {
        if (
          !paginationOptions.status ||
          paginationOptions.status < SPKStatus.APPROVED
        ) {
          data.andWhere('spk-operational.status >= :status', {
            status: SPKStatus.PAID,
          });
        }
      } else if (currentUser.employeePosition.code == RoleEnum.SUPERADMIN) {
        data.withDeleted();
      } else {
        filterRegion = false;

        data.leftJoinAndSelect('spk-operational.inhouse_team', 'inhouse_team');

        data.andWhere(
          new Brackets((qb) => {
            qb.where('inhouse_team.user_id = :inHouseUserId', {
              inHouseUserId: user.id,
            })
              .orWhere('spk-operational.created_by = :createdBy', {
                createdBy: user.id,
              })
              .orWhere('spk-operational.pay_to_user_id = :payToUserId', {
                payToUserId: user.id,
              });
          }),
        );
      }
    }

    if (
      currentUser.employeePosition.code != RoleEnum.SUPERADMIN &&
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
          data.andWhere('LOWER(region.name) IN (:...filterRegion)', {
            filterRegion: reg,
          });
        }
      }
    }

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where('spk-operational.spk_number ILIKE :search', {
            search: `%${paginationOptions.search}%`,
          });
        }),
      );
    }

    if (paginationOptions.start_date) {
      data.andWhere('spk-operational.created_at >= :start_date', {
        start_date: `${paginationOptions.start_date}`,
      });
    }

    if (paginationOptions.end_date) {
      data.andWhere('spk-operational.created_at <= :end_date', {
        end_date: `${paginationOptions.end_date}`,
      });
    }

    if (paginationOptions.status) {
      const stat = paginationOptions.status;
      if (stat == SPKStatus.APPROVED) {
        data.andWhere(
          new Brackets((qb) => {
            qb.where(
              new Brackets((qb2) => {
                qb2
                  .where('spk-operational.status = :status', {
                    status: SPKStatus.APPROVED,
                  })
                  .andWhere('spk-operational.is_over_budget = false');
              }),
            ).orWhere('spk-operational.status = :status3', {
              status3: SPKStatus.APPROVED_OVER_BUDGET,
            });
          }),
        );
      } else if (stat == SPKStatus.WAITING_APPROVAL_PM) {
        data.andWhere('spk-operational.status = :status', {
          status: SPKStatus.APPROVED,
        });
        data.andWhere('spk-operational.is_over_budget = true');
      } else if (stat == SPKStatus.PAID) {
        data.andWhere('spk-operational.status = :status', {
          status: SPKStatus.PAID,
        });
        data.andWhere('cost_evidences.id IS NOT NULL');
      } else if (stat == SPKStatus.PAID_NEED_EVIDENCE) {
        data.andWhere('spk-operational.status = :status', {
          status: SPKStatus.PAID,
        });
        data.andWhere('cost_evidences.id IS NULL');
      } else if (
        stat == SPKStatus.CREATED ||
        stat == SPKStatus.CREATED_OVER_BUDGET
      ) {
        data.andWhere(
          new Brackets((qb) => {
            qb.where('spk-operational.status = :status', {
              status: SPKStatus.CREATED,
            }).orWhere('spk-operational.status = :status3', {
              status3: SPKStatus.CREATED_OVER_BUDGET,
            });
          }),
        );
      } else {
        data.andWhere('spk-operational.status = :status', {
          status: stat,
        });
      }
    }

    data.orderBy('spk-operational.created_at', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const returnedData = await data.getMany();

    return infinityPagination(
      returnedData,
      SPKOperationalResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<SPKOperational>, user?: User) {
    const data = await this.spkOperationalRepository
      .createQueryBuilder('spk-operational')
      .leftJoinAndSelect('spk-operational.cost_evidences', 'cost_evidences')
      .withDeleted()
      .leftJoinAndSelect('spk-operational.region', 'region')
      .leftJoinAndSelect('spk-operational.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect('spk-operational.area', 'area')
      .leftJoinAndSelect('spk-operational.inhouse_team', 'inhouse_team')
      .leftJoinAndSelect('spk-operational.customer', 'customer')
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .leftJoinAndSelect('userInhouse.employeePosition', 'employeePosition')
      .leftJoinAndSelect(
        'spk-operational.transfer_proof_file',
        'transfer_proof_file',
      )
      .leftJoinAndSelect(
        'cost_evidences.cost_evidence_photo_file',
        'cost_evidence_photo_file',
      )
      .leftJoinAndSelect('spk-operational.created_by_user', 'created_by_user')
      .leftJoinAndSelect('spk-operational.approved_by_user', 'approved_by_user')
      .leftJoinAndSelect(
        'spk-operational.approved_over_budget_by_user',
        'approved_over_budget_by_user',
      )
      .leftJoinAndSelect('spk-operational.paid_by_user', 'paid_by_user')
      .leftJoinAndSelect('spk-operational.closed_by_user', 'closed_by_user')
      .leftJoinAndSelect('spk-operational.category', 'category')
      .leftJoinAndSelect('spk-operational.subcategory', 'subcategory')
      .leftJoinAndSelect('spk-operational.request_type', 'request_type')
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
        return SPKOperationalResourceDetail(data, data.remark_superadmin);
      }
    }

    return SPKOperationalResourceDetail(data);
  }

  async findOneFull(fields: EntityCondition<SPKOperational>) {
    const data = await this.spkOperationalRepository
      .createQueryBuilder('spk-operational')
      .leftJoinAndSelect('spk-operational.inhouse_team', 'inhouse_team')
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .where(fields)
      .getOne();

    return data;
  }

  async updateSettlement(
    id: number,
    updateSPKSettlementDTO: UpdateSPKOperationalSettlementDTO,
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
      currentUser.employeePosition?.grant_all_access == false
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
      currentUser.employeePosition?.grant_all_access == false
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

    // over budget rules
    // let maxBudgetBySite = await getManager().query(
    //   "SELECT SUM(unit_price * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
    //   [exists.site_id],
    // );

    // maxBudgetBySite = maxBudgetBySite[0].sum
    //   ? Math.round(Number(maxBudgetBySite[0].sum))
    //   : 0;

    // let totalSPKAmount = await getManager().query(
    //   'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [exists.site_id],
    // );
    // totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    // let totalCashback = await getManager().query(
    //   'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [exists.site_id],
    // );
    // totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    // let totalCashout = await getManager().query(
    //   'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [exists.site_id],
    // );
    // totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    // totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    if (
      exists.cash_advance > appConfig().spkOperationMaxBudget &&
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

    await this.spkOperationalRepository.update(id, updateData);

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
      await this.spkOperaionalCostEvidenceRepository.softDelete(deleted_id);
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
          spk_operational_id: spkId,
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
        await this.spkOperaionalCostEvidenceRepository.insert(insertData);
      }

      if (updateData.length > 0) {
        for (const data of updateData) {
          await this.spkOperaionalCostEvidenceRepository.update(data.id, data);
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
    const existingSPK = await this.spkOperationalRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status >= SPKStatus.PAID) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak bisa dihapus!`);
    }

    await this.spkOperationalRepository.softDelete(id);

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
    const existingSPK = await this.spkOperationalRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status >= SPKStatus.PAID) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `SPK tidak dapat diapprove kembali!`,
      );
    }

    //over budget rule
    // let maxBudgetBySite = await getManager().query(
    //   "SELECT SUM(unit_price * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1 AND status NOT ILIKE '%cancel%' AND deleted_at IS NULL",
    //   [existingSPK.site_id],
    // );

    // maxBudgetBySite = maxBudgetBySite[0].sum
    //   ? Math.round(Number(maxBudgetBySite[0].sum))
    //   : 0;

    // let totalSPKAmount = await getManager().query(
    //   'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [existingSPK.site_id],
    // );
    // totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    // let totalCashback = await getManager().query(
    //   'SELECT SUM(cashback) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [existingSPK.site_id],
    // );
    // totalCashback = totalCashback[0].sum ? Number(totalCashback[0].sum) : 0;

    // let totalCashout = await getManager().query(
    //   'SELECT SUM(cashout) FROM spk WHERE site_id = $1 AND deleted_at IS NULL',
    //   [existingSPK.site_id],
    // );
    // totalCashout = totalCashout[0].sum ? Number(totalCashout[0].sum) : 0;

    // totalSPKAmount = totalSPKAmount - totalCashback + totalCashout;

    if (existingSPK.cash_advance <= appConfig().spkOperationMaxBudget) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK belum over budget`);
    }

    await this.spkOperationalRepository.update(id, {
      status: SPKStatus.APPROVED_OVER_BUDGET,
      approved_over_budget_by: user.id,
      remark_pm: remark,
    });

    return null;
  }

  async approve(id: number, user: User, remark: string): Promise<void> {
    const existingSPK = await this.spkOperationalRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status >= SPKStatus.APPROVED) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `SPK tidak dapat diapprove kembali!`,
      );
    }

    await this.spkOperationalRepository.update(id, {
      status: SPKStatus.APPROVED,
      approved_by: user.id,
      remark_rpm: remark,
    });

    return null;
  }

  async reject(id: number, user: User, remark: string): Promise<void> {
    const existingSPK = await this.spkOperationalRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (
      existingSPK.status == SPKStatus.CREATED ||
      existingSPK.status == SPKStatus.CREATED_OVER_BUDGET
    ) {
      await this.spkOperationalRepository.update(id, {
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
    const existingSPK = await this.spkOperationalRepository.findOne(id);
    if (!existingSPK) {
      throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak ditemukan!`);
    } else if (existingSPK.status == SPKStatus.APPROVED) {
      await this.spkOperationalRepository.update(id, {
        status: SPKStatus.REJECTED,
        approved_by: user.id,
        remark_rpm: remark,
      });

      return null;
    }

    throw failedResponse(HttpStatus.BAD_REQUEST, `SPK tidak dapat direject!`);
  }
}
