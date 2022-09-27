import { Role } from 'src/entities/role.entity';

export const MasterRoleResource = (role: Role): any => {
  return {
    id: role.id,
    nama_peran: role.name,
  };
};
