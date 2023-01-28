import minioConfig from 'src/config/minio.config';
import { User } from 'src/entities/user.entity';

export const ExportUserResource = (user: User): any => {
  let role = '';

  if (user.userRoles != null && user.userRoles.length > 0) {
    const dataRole = user.userRoles.find((role) => role.role_id != 1);
    if (dataRole && dataRole.roleData) {
      role = dataRole.roleData.name;
    } else if (user.userRoles[0].roleData) {
      role = user.userRoles[0].roleData.name;
    }
  }

  return {
    NIK: user.nik,
    Nama: user.name,
    Email: user.email,
    Status: user.status ? 'Aktif' : 'Tidak Aktif',
    Photo: user.photoFile ? minioConfig().fullUrl + user.photoFile.path : null,
    Role: role,
    Jabatan: user.employeePosition ? user.employeePosition.name : null,
  };
};
