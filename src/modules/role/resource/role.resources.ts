import { Role } from 'src/entities/role.entity';

export const RoleResource = (role: Role): any => {
  return {
    id: role.id,
    name: role.name,
    user_count: role.userCount,
  };
};
