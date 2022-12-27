/* eslint-disable prettier/prettier */

import { PurchaseOrder } from "src/entities/purchase-order.entity";

export const PurchaseOrderResource = (po: PurchaseOrder): any => {
  return {
    id: po.id,
    cc: po.cc,
  };
};
