import minioConfig from 'src/config/minio.config';
import { User } from 'src/entities/user.entity';

export const ExportUserResource = (user: User): any => {
  return {
    NIK: user.nik,
    Nama: user.name,
    Email: user.email,
    Status: user.status ? 'Aktif' : 'Tidak Aktif',
    Photo: user.photoFile ? minioConfig().fullUrl + user.photoFile.path : null,
    Jabatan: user.employeePosition ? user.employeePosition.name : null,
  };
};
