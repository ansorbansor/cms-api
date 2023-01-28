import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RoleResource } from './resource/role.resources';
import { Role } from 'src/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleEnum } from 'src/utils/enums';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from 'src/entities/user.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    private activityLogService: ActivityLogService,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: User, ip: string) {
    const role = await this.roleRepository.save(
      this.roleRepository.create({
        ...createRoleDto,
      }),
    );

    await this.activityLogService.create({
      user_id: user.id,
      description: `Tambah Peran Pengguna ${createRoleDto.name}`,
      ip: ip,
    });

    return this.findOne({ id: role.id });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.roleAccess', 'roleAccess')
      .leftJoinAndSelect('role.userRole', 'userRole')
      .leftJoinAndSelect('roleAccess.menu', 'menu');

    if (paginationOptions.search) {
      data.andWhere(`LOWER(role.name) LIKE :search`, {
        search: `%${paginationOptions.search.toLowerCase()}%`,
      });
    }

    data.orderBy('role.name', 'ASC');

    const total = await this.roleRepository.count();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const getData = await data.getMany();

    return infinityPagination(getData, RoleResource, paginationOptions);
  }

  async findOne(fields: EntityCondition<Role>) {
    const data = await this.roleRepository.findOne({
      relations: ['roleAccess', 'roleAccess.menu', 'roleAccess.role'],
      where: fields,
    });

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Role tidak ditemukan',
      );
    }

    return RoleResource(data);
  }

  async update(updateRoleDto: UpdateRoleDto, user: User, ip: string) {
    const exists = await this.findOne({ id: updateRoleDto.id });

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Role tidak ditemukan',
      );
    }

    await this.roleRepository.update(updateRoleDto.id, {
      name: updateRoleDto.name,
    });

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Peran Pengguna ${updateRoleDto.name}`,
      ip: ip,
    });

    //revoked token
    await getManager().query(
      ` UPDATE 
          oauth_tokens 
        SET 
          revoked = true 
        WHERE 
          user_id IN (
            SELECT users.id 
            FROM users, user_roles 
            WHERE users.id = user_roles.user_id 
              AND user_roles.role_id = ${exists.id}
          )`,
    );

    return await this.findOne({ id: updateRoleDto.id });
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id: id } });
    if (role.code == RoleEnum.SUPERADMIN) {
      throw failedResponse(
        HttpStatus.FORBIDDEN,
        'Superadmin tidak bisa dihapus',
      );
    }

    const deletedData = await this.roleRepository.findOne({ id: id });

    await this.roleRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Peran Pengguna ${deletedData.name}`,
      ip: ip,
    });
  }
}
