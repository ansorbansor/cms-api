import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';
import { PerjalananDinas } from 'src/entities/perjalanan-dinas.entity';
import { CreatePerjalananDinasDTO } from './dto/create-perjalanan-dinas.dto';
import { UpdatePerjalananDinasDTO } from './dto/update-perjalanan-dinas.dto';
import { PerjalananDinasResource } from './resources/perjalanan-dinas.resources';

@Injectable()
export class PerjalananDinasService {
  constructor(
    @InjectRepository(PerjalananDinas)
    private perjalananDinasRepository: Repository<PerjalananDinas>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createDTO: CreatePerjalananDinasDTO, user_id?: number, ip?: string) {
    const data = await this.perjalananDinasRepository.save(
      this.perjalananDinasRepository.create({
        ...createDTO,
        user_id: user_id,
        status: 'Draft',
      }),
    );

    await this.activityLogService.create({
      user_id: user_id,
      description: `Tambah Perjalanan Dinas`,
      ip: ip,
    });

    return data;
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions, user?: User) {
    let fullUser = null;
    if (user && user.id) {
      fullUser = await this.perjalananDinasRepository.manager.findOne(User, {
        where: { id: user.id },
        relations: ['employeePosition']
      });
    }

    const data = this.perjalananDinasRepository.createQueryBuilder('pd')
      .leftJoinAndSelect('pd.user', 'user')
      .leftJoinAndSelect('pd.attachment', 'attachment');

    if (paginationOptions.search) {
      data.andWhere('pd.destination_city ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    const isSuperAdmin = fullUser && (
      fullUser.id === 1 ||
      fullUser.employee_position_id == 1 ||
      fullUser.employee_position_id == 4 ||
      fullUser.employeePosition?.code === 'superadmin' ||
      fullUser.employeePosition?.name?.toLowerCase() === 'superadmin' ||
      fullUser.employeePosition?.name === 'Super Admin' ||
      fullUser.employeePosition?.name === 'Superadmin Position' ||
      fullUser.employeePosition?.grant_all_access === true ||
      fullUser.employeePosition?.grant_all_access === 1
    );

    if (!isSuperAdmin) {
      data.andWhere('pd.user_id = :user_id', { user_id: user?.id });
    }

    data.orderBy('pd.created_at', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const items = await data.getMany();
    return infinityPagination(
      items,
      PerjalananDinasResource,
      paginationOptions,
    );
  }

  async findOne(fields: EntityCondition<PerjalananDinas>) {
    const data = await this.perjalananDinasRepository
      .createQueryBuilder('pd')
      .leftJoinAndSelect('pd.user', 'user')
      .leftJoinAndSelect('pd.attachment', 'attachment')
      .where(fields)
      .getOne();

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Perjalanan Dinas tidak ditemukan',
      );
    }

    return PerjalananDinasResource(data);
  }

  async update(id: number, updateDTO: UpdatePerjalananDinasDTO, user: User, ip: string) {
    const exists = await this.perjalananDinasRepository.findOne({ where: { id } });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Perjalanan Dinas tidak ditemukan',
      );
    }
    
    // Only super admin can change status, EXCEPT when owner is submitting a draft
    if (updateDTO.status && updateDTO.status !== exists.status) {
      let fullUser = null;
      if (user && user.id) {
        fullUser = await this.perjalananDinasRepository.manager.findOne(User, {
          where: { id: user.id },
          relations: ['employeePosition']
        });
      }

      const isSuperAdmin = fullUser && (
        fullUser.id === 1 ||
        fullUser.employee_position_id == 1 ||
        fullUser.employee_position_id == 4 ||
        fullUser.employeePosition?.code === 'superadmin' ||
        fullUser.employeePosition?.name?.toLowerCase() === 'superadmin' ||
        fullUser.employeePosition?.name === 'Super Admin' ||
        fullUser.employeePosition?.name === 'Superadmin Position' ||
        fullUser.employeePosition?.grant_all_access === true ||
        fullUser.employeePosition?.grant_all_access === 1
      );
      const isOwnerSubmitting = exists.user_id === user?.id && exists.status === 'Draft' && updateDTO.status === 'Pending Approval';

      if (!isSuperAdmin && !isOwnerSubmitting) {
         throw failedResponse(
          HttpStatus.FORBIDDEN,
          'Hanya Super Admin yang dapat mengubah status',
        );
      }
    }

    await this.perjalananDinasRepository.update(id, {
      ...updateDTO,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Data Perjalanan Dinas ID ${id}`,
      ip: ip,
    });

    return await this.findOne({ id: id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    await this.perjalananDinasRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Data Perjalanan Dinas ID ${id}`,
      ip: ip,
    });
  }
}
