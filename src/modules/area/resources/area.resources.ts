/* eslint-disable prettier/prettier */

import { Area } from "src/entities/area.entity";

export const AreaResource = (area: Area): any => {
  return {
    id: area.id,
    name: area.name,
  };
};
