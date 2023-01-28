import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import * as moment from 'moment';

export const PurchaseOrderResource = (po: PurchaseOrder): any => {
  return {
    id: po.id,
    cc: po.cc,
    po_number: po.po_number,
    line_po_status:
      po.line_po_status && po.line_po_status == 1 ? 'Active' : 'Non Active',
    region_name: po.region ? po.region.name : '-',
    project_name: po.project ? po.project.name : '-',
  };
};

export const PurchaseOrderBySiteResource = (po: PurchaseOrder): any => {
  return {
    id: po.id,
    cc: po.cc,
    po_number: po.po_number,
    item_description: po.item_description,
  };
};

export const PurchaseOrderDetailResource = (po: PurchaseOrder): any => {
  return {
    id: po.id,
    cc: po.cc,
    line_po_number: po.line_po_number ? po.line_po_number : '-',
    po_number: po.po_number ? po.po_number : '-',
    shipment_number: po.shipment_number ? po.shipment_number : '-',
    po_status: po.status ? po.status : '-',
    line_po_status:
      po.line_po_status && po.line_po_status == 1 ? 'Active' : 'Non Active',
    region_name: po.region ? po.region.name : '-',
    area_name: po.area ? po.area.name : '-',
    operator_name: po.operator ? po.operator.name : '-',
    customer_name: po.customer ? po.customer.name : '-',
    project: {
      name: po.project ? po.project.name : '-',
      code: po.project ? po.project.code : '-',
    },
    site: {
      name: po.site ? po.site.name : '-',
      code: po.site ? po.site.code : '-',
    },
    item_code: po.item_code ? po.item_code : '-',
    unit_price: po.unit_price ? po.unit_price : '-',
    item_description: po.item_description ? po.item_description : '-',
    unit_price_1: po.unit_price_1 ? po.unit_price_1 : '-',
    unit_price_2: po.unit_price_2 ? po.unit_price_2 : '-',
    requested_qty: po.requested_qty ? po.requested_qty : '-',
    billed_qty: po.billed_qty ? po.billed_qty : '-',
    due_qty: po.due_qty ? po.due_qty : '-',
    line_amount: po.line_amount ? po.line_amount : '-',
    remaining_from_po: po.remaining_from_po ? po.remaining_from_po : '-',
    unit: po.unit ? po.unit : '-',
    payment_terms: po.payment_terms ? po.payment_terms : '-',
    bidding_area: po.bidding_area ? po.bidding_area.name : '-',
    publish_date: po.publish_date ? po.publish_date : '-',
    start_date: po.start_date ? po.start_date : '-',
    end_date: po.end_date ? po.end_date : '-',
    remark_weekly: po.remark_weekly ? po.remark_weekly : '-',
    remark_project: po.remark_project ? po.remark_project.name : '-',
    remark_highlight: po.remark_highlight ? po.remark_highlight : '-',
    aging_po: po.publish_date ? moment().diff(po.publish_date, 'day') : '-',
    priority_esar_approve: po.priority_esar_approve
      ? po.priority_esar_approve
      : '-',
    status_acceptance: po.status_acceptance ? po.status_acceptance.name : '-',
    pending_type: po.pending_type ? po.pending_type.name : '-',
    pending_approval_pd: po.pending_approval_pd ? po.pending_approval_pd : '-',
    amount_pending_approval_pd: po.amount_pending_approval_pd
      ? po.amount_pending_approval_pd
      : '-',
    pd: po.pd ? po.pd.name : '-',
    actual_completion_date_vs_to_pd: po.actual_completion_date
      ? po.actual_completion_date
      : '-',
    ready_invoice: po.ready_invoice ? po.ready_invoice : '-',
    amount_ready_invoice: po.amount_ready_invoice
      ? po.amount_ready_invoice
      : '-',
    invoices: po.po_invoice
      ? po.po_invoice.map((e) => {
          return {
            invoice_number: e.invoice_number,
            date: e.invoice_date,
            status: e.invoice_status,
            payment_date: e.payment_date,
            supplier_tax_number: e.supplier_tax_number,
            supplier_tax_date: e.supplier_tax_date,
          };
        })
      : [],
  };
};
