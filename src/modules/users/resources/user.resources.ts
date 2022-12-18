/* eslint-disable prettier/prettier */

import appConfig from "src/config/app.config";
import { User } from "src/entities/user.entity";

export const UserResource = (user: User): any => {
  const mapRole = [];

  user.userRoles != null ? user.userRoles.map((role) => {
    if (role.roleData) {
      mapRole.push({
        id: role.roleData ? role.roleData.id : null,
        name: role.roleData ? role.roleData.name: null
      });
    }
  }) : [];

  return {
    id: user.id,
    nik: user.nik,
    name: user.name,
    email: user.email,
    provider: user.provider,
    status: user.status,
    notification_token: user.notification_token,
    photo: user.photoFile ? appConfig().fullBackendDomain + user.photoFile.path : null,
    roles: mapRole,
    position: {
      id: user.employeePosition ? user.employeePosition.id : null,
      name: user.employeePosition ? user.employeePosition.name : null
    },
  };
};
