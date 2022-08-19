import { Role } from 'src/entities/role.entity';

export const RoleResource = (role: Role): any => {
  const mapMenu =
    role.roleAccess != null
      ? role.roleAccess.map((roleAccess) => {
          return {
            role_access_id: roleAccess.id ? roleAccess.id : null,
            menu_id: roleAccess.menu ? roleAccess.menu.id : null,
            menu_name: roleAccess.menu ? roleAccess.menu.name : null,
            menu_access: roleAccess.menu ? roleAccess.menu_access : null,
          };
        })
      : [];

  return {
    id: role.id,
    name: role.name,
    menu: mapMenu,
    user_count: role.userCount,
    admin_access: mapMenu.length > 0,
  };
};
