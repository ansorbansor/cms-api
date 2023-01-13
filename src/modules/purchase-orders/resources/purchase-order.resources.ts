/* eslint-disable prettier/prettier */

import { PurchaseOrder } from "src/entities/purchase-order.entity";

export const PurchaseOrderResource = (po: PurchaseOrder): any => {
  return {
    id: po.id,
    cc: po.cc,
    line_po_status: po.line_po_status && po.line_po_status == 1 ? 'Active' : 'Non Active',
    region_name: po.region ? po.region.name : '-',
    project_name: po.project ? po.project.name : '-',
  };
};
