import { PurchaseOrder } from 'src/entities/purchase-order.entity';

export const GraphOrderListResource = (data: PurchaseOrder): any => {
  return {
    project_name: data.project ? data.project.name : '-',
    project_code: data.project ? data.project.code : '-',
    site_code: data.site ? data.site.code : '-',
    site_name: data.site ? data.site.name : '-',
    status: data.status,
    po_number: data.po_number,
    line_po_number: data.line_po_number,
    shipment_number: data.shipment_number,
    item_code: data.item_code,
    item_description: data.item_description,
    unit_price: data.unit_price,
    unit_price_1: data.unit_price_1,
    unit_price_2: data.unit_price_2,
    requested_qty: data.requested_qty,
    billed_qty: data.billed_qty,
    due_qty: data.due_qty,
    line_amount: data.line_amount,
    remaining_from_po: data.remaining_from_po,
    unit: data.unit,
    payment_terms: data.payment_terms,
    bidding_area_name: data.bidding_area ? data.bidding_area.name : '-',
    publish_date: data.publish_date,
    start_date: data.start_date,
    end_date: data.end_date,
    priority_esar_approve: data.priority_esar_approve,
    remark_weekly: data.remark_weekly,
  };
};

export const ActualWorkAmountPerMonthResource = (data: any): any => {
  return {
    name: data.mon.trim(),
    status: data.status,
    value: Number(data.sum),
  };
};
