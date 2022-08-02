/* eslint-disable prettier/prettier */

import { User } from "src/entities/user.entity";

export const UserResource = (user: User): any => {
  const mapRole = user.userRole != null ? user.userRole.map((role) => {
    return {
      id: role.role.id,
      name: role.role.name
    }
  }) : [];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider,
    status: user.status,
    notification_token: user.notification_token,
    photo: user.photo ? user.photo.path : null,
    roles: mapRole,
    unit: {
      id: user.employeeUnit ? user.employeeUnit.id : null,
      name: user.employeeUnit ? user.employeeUnit.name : null
    }
  };
};
