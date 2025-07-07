/* eslint-disable prettier/prettier */

import { User } from "src/entities/user.entity";

export const ResetPasswordDataResource = (user: User): any => {
  return {
    name: user.name,
    email: user.email,
  };
};
