import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { getManager, getRepository, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { SPK } from 'src/entities/spk.entity';
import { CreateSPKDTO } from './dto/create.spk.dto';
import { UpdateSPKDTO } from './dto/update-spk.dto';
import { FilesService } from '../files/files.service';
import { FilePath, RoleEnum, SPKStatus } from 'src/utils/enums';
import { SPKInhouseTeam } from 'src/entities/spk-inhouse-team.entity';
import { UpdateSPKSettlementDTO } from './dto/update-spk-settlement.dto';
import { SPKCostEvidence } from 'src/entities/spk-cost-evidence.entity';
import { UserRoles } from 'src/entities/user-role.entity';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import * as fs from 'fs';
import { SPKResource, SPKResourceDetail } from './resources/spk.resources';

@Injectable()
export class SPKService {
  constructor(
    @InjectRepository(SPK)
    private spkRepository: Repository<SPK>,
    @InjectRepository(SPKInhouseTeam)
    private spkInhouseTeamRepository: Repository<SPKInhouseTeam>,
    @InjectRepository(SPKCostEvidence)
    private spkCostEvidenceRepository: Repository<SPKCostEvidence>,
    @InjectRepository(UserRoles)
    private userRolesRepository: Repository<UserRoles>,
    private activityLogService: ActivityLogService,
    private fileService: FilesService,
  ) {}

  async create(
    createSPKDTO: CreateSPKDTO,
    user_id: number,
    ip: string,
    files: Array<Express.Multer.File>,
  ) {
    const distanceToSitePhoto = files.find((e) => {
      return e.fieldname == 'distance_to_site_photo';
    });
    const kmRangeStartPhoto = files.find((e) => {
      return e.fieldname == 'km_range_start_photo';
    });
    const kmRangeEndPhoto = files.find((e) => {
      return e.fieldname == 'km_range_end_photo';
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

    let maxBudgetBySite = await getManager().query(
      'SELECT SUM(unit_price * budget_percentage / 100) FROM purchase_orders WHERE site_id = $1',
      [createSPKDTO.area_id],
    );
    maxBudgetBySite = maxBudgetBySite[0].sum
      ? Number(maxBudgetBySite[0].sum)
      : 0;

    let totalSPKAmount = await getManager().query(
      'SELECT SUM(cash_advance) FROM spk WHERE site_id = $1',
      [createSPKDTO.area_id],
    );
    totalSPKAmount = totalSPKAmount[0].sum ? Number(totalSPKAmount[0].sum) : 0;

    const cashAdvance = Number(createSPKDTO.cash_advance);

    if (maxBudgetBySite < totalSPKAmount + cashAdvance) {
      createSPKDTO.status = SPKStatus.CREATED_OVER_BUDGET;
    } else {
      createSPKDTO.status = SPKStatus.APPROVED;
    }

    createSPKDTO.created_by = user_id;
    createSPKDTO.approved_by = user_id;

    const spk = await this.spkRepository.save(
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

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah SPK`,
      ip: ip,
    });

    return await this.findOne({ id: spk.id });
  }

  async findManyWithPagination(
    paginationOptions: IPaginationOptions,
    user: User,
  ) {
    const data = this.spkRepository
      .createQueryBuilder('spk')
      .leftJoinAndSelect('spk.region', 'region')
      .leftJoinAndSelect('spk.transportation', 'transportation')
      .leftJoinAndSelect('spk.pay_to_user', 'pay_to_user')
      .leftJoinAndSelect('spk.site', 'site')
      .leftJoinAndSelect('spk.area', 'area')
      .leftJoinAndSelect('spk.po', 'po')
      .leftJoinAndSelect('spk.inhouse_team', 'inhouse_team')
      .leftJoinAndSelect('inhouse_team.userInhouse', 'userInhouse')
      .leftJoinAndSelect('spk.distance_to_site_file', 'distance_to_site_file')
      .leftJoinAndSelect('spk.km_range_start_file', 'km_range_start_file')
      .leftJoinAndSelect('spk.km_range_end_file', 'km_range_end_file')
      .leftJoinAndSelect('spk.check_in_file', 'check_in_file')
      .leftJoinAndSelect('spk.check_out_file', 'check_out_file')
      .leftJoinAndSelect('spk.cost_evidences', 'cost_evidences')
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
      .leftJoinAndSelect('spk.closed_by_user', 'closed_by_user');

    //add total spk cash advance
    data.addSelect(
      'total_cash_advance.total_cash_advance',
      'spk_total_cash_advance',
    );
    data.leftJoin(
      (qb) => {
        return qb
          .select('s.site_id')
          .addSelect('SUM(s.cash_advance)', 'total_cash_advance')
          .from(SPK, 's')
          .groupBy('s.site_id');
      },
      'total_cash_advance',
      '"total_cash_advance"."s_site_id" = spk.site_id',
    );

    //add total po budget / unit price
    data.addSelect(
      'total_unit_price.total_unit_price',
      'spk_total_po_unit_price',
    );
    data.leftJoin(
      (qb) => {
        return qb
          .select('p.site_id')
          .addSelect('SUM(p.unit_price)', 'total_unit_price')
          .from(PurchaseOrder, 'p')
          .groupBy('p.site_id');
      },
      'total_unit_price',
      '"total_unit_price"."p_site_id" = spk.site_id',
    );

    const userRole = await this.userRolesRepository.find({
      where: { user_id: user.id },
    });

    if (userRole.some((e) => e.roleData.code == RoleEnum.SS)) {
      data.andWhere('spk.created_by = :createdBy', { createdBy: user.id });
    } else if (
      userRole.some(
        (e) =>
          e.roleData.code == RoleEnum.TL ||
          e.roleData.code == RoleEnum.ENGINEER ||
          e.roleData.code == RoleEnum.MEMBER,
      )
    ) {
      data.where('inhouse_team.user_id = :inHouseUserId', {
        inHouseUserId: user.id,
      });
    } else if (userRole.some((e) => e.roleData.code == RoleEnum.RPM)) {
      data.andWhere(
        'total_cash_advance.total_cash_advance > total_unit_price.total_unit_price',
      );
    } else if (userRole.some((e) => e.roleData.code == RoleEnum.ADMINPAYMENT)) {
      data.andWhere('spk.status >= :status', {
        status: SPKStatus.APPROVED,
      });
    }

    if (paginationOptions.search) {
      data.andWhere('spk.spk_number ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('spk.created_at', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const returnedData = await data.getMany();

    return infinityPagination(returnedData, SPKResource, paginationOptions);
  }

  async findOne(fields: EntityCondition<SPK>) {
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
      .leftJoinAndSelect('spk.km_range_start_file', 'km_range_start_file')
      .leftJoinAndSelect('spk.km_range_end_file', 'km_range_end_file')
      .leftJoinAndSelect('spk.check_in_file', 'check_in_file')
      .leftJoinAndSelect('spk.check_out_file', 'check_out_file')
      .leftJoinAndSelect('spk.cost_evidences', 'cost_evidences')
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
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
      );
    }

    return SPKResourceDetail(data);
  }

  async findOneFull(fields: EntityCondition<SPK>) {
    const data = await this.spkRepository
      .createQueryBuilder('spk')
      .where(fields)
      .getOne();

    return data;
  }

  async update(id: number, updateSPKDTO: UpdateSPKDTO, user: User, ip: string) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
      );
    }

    await this.spkRepository.update(id, {
      ...updateSPKDTO,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data SPK`,
      ip: ip,
    });

    return await this.findOne({ id: id });
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
    user_id: number,
    ip: string,
  ) {
    const exists = await this.findOneFull({ id: id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SPK tidak ditemukan',
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

    await this.spkRepository.update(id, {
      closing_date: updateSPKSettlementDTO.closing_date,
      operation_cost: updateSPKSettlementDTO.operation_cost,
      remark_admin: updateSPKSettlementDTO.remarks,
      paid_by: user_id,
      closed_by: user_id,
      delta_of_settlement: deltaOfSettlement,
      cashback: cashback,
      cashout: cashout,
      status: updateSPKSettlementDTO.status,
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
    await this.spkRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data SPK`,
      ip: ip,
    });
  }
}
