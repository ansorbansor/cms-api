/* eslint-disable prettier/prettier */

import { User } from "src/entities/user.entity";

export const TwoFactorAuthResource = (image: string, user: User): any => {
  return {
    nip: user.nip,
    name: user.name,
    image: image,
  }
};
