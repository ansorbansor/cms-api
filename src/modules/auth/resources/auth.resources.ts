/* eslint-disable prettier/prettier */

import { User } from "src/entities/user.entity";

export const AuthResource = (token: string, user: User): any => {
  const mapRole = user.userRoles.map((role) => {
    return {
      id: role.roleData.id,
      name: role.roleData.name
    }
  });
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
    }
  };
};
