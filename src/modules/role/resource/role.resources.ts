import { Role } from 'src/entities/role.entity';

export const RoleResource = (role: Role): any => {
  const mapMenu = [];
  if (role.roleAccess) {
    role.roleAccess.forEach((roleAccess) => {
      //filtering data access, dont return READ access (1) if access only can delete
      const filterMenu = role.roleAccess.filter((e) => {
        return e.menu_id == roleAccess.menu_id;
      });
      if (
        roleAccess.menu_access == 1 &&
        filterMenu.length == 2 &&
        filterMenu.find((e) => {
          return e.menu_access == 1;
        }) &&
        filterMenu.find((e) => {
          return e.menu_access == 3;
        })
      ) {
        return;
      }

      mapMenu.push({
        role_access_id: roleAccess.id ? roleAccess.id : null,
        menu_id: roleAccess.menu ? roleAccess.menu.id : null,
        menu_name: roleAccess.menu ? roleAccess.menu.name : null,
        menu_access: roleAccess.menu ? roleAccess.menu_access : null,
      });
    });
  }

  return {
    id: role.id,
    name: role.name,
    menu: mapMenu,
    user_count: role.userCount,
    admin_access: mapMenu.length > 0,
  };
};
