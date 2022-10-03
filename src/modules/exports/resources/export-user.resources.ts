/* eslint-disable prettier/prettier */

import minioConfig from "src/config/minio.config";
import { User } from "src/entities/user.entity";
import { RoleEnum } from "src/utils/enums";

export const ExportUserResource = (user: User): any => {
  let role = '';

  if (user.userRoles != null && user.userRoles.length > 0) {
    const dataRole = user.userRoles.find(
      (role) => role.role_id != RoleEnum.user,
    );
    if (dataRole && dataRole.roleData) {
      role = dataRole.roleData.name
    } else if(user.userRoles[0].roleData) {
      role = user.userRoles[0].roleData.name
    }
  }

  return {
    NIP: user.nip,
    Nama: user.name,
    Email: user.email,
    Status: user.status ? 'Aktif' : 'Tidak Aktif',
    Photo: user.photoFile ? minioConfig().fullUrl + user.photoFile.path : null,
    Role: role,
    Blacklist: user.blacklist ? 'Ya' : 'Tidak',
    Unit: user.employeeUnit ? user.employeeUnit.name : null,
    Pangkat: user.employeeLevel ? user.employeeLevel.name : null,
    Jabatan: user.employeePosition ? user.employeePosition.name : null,
    Jam_Pembelajaran: user.total_lesson_hours,
    Total_Pembelajaran: user.total_lesson,
    Level_Pengguna: user.level ? user.level : 0,
  };
};
