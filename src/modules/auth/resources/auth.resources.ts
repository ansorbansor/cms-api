/* eslint-disable prettier/prettier */

import { Menu } from "src/entities/menu.entity";
import { User } from "src/entities/user.entity";

export const AuthResource = (token: string, user: User, menu: Menu[]): any => {
  const mapRole = user.userRoles.map((role) => {
    return {
      id: role.roleData.id,
      name: role.roleData.name
    }
  });

  const menuAccess = [];
  if (menu) {
    menu.forEach((e) => {
      menuAccess.push({
        id: e.id,
        name: e.name,
      })
    })
  } else {
    user.userRoles.forEach((element) => {
      if (element.roleData && element.roleData.roleAccess) {
        element.roleData.roleAccess.forEach((menus) => {
          if (menus.menu_id && !menuAccess.some((e) => e.id == menus.menu_id)) {
            menuAccess.push({
              id: menus.menu_id,
              name: menus.menu.name,
            });
          }
        });
      }
    });
  }

  return {
    token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
      status: user.status,
      notification_token: user.notification_token,
      roles: mapRole,
    },
    menu_access: menuAccess,
  };
};
