/* eslint-disable prettier/prettier */

import { Menu } from "src/entities/menu.entity";

export const MenuResource = (menu: Menu): any => {
  return {
    id: menu.id,
    name: menu.name,
  };
};
