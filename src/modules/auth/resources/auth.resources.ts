/* eslint-disable prettier/prettier */

import { User } from "src/entities/user.entity";

export const AuthResource = (token: string, user: User): any => {
  const mapRole = user.userRole.map((role) => {
    return {
      id: role.role.id,
      name: role.role.name
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
