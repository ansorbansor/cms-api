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
    status: po.status,
  };
};

export const PurchaseOrderBySiteResource = (
  po: PurchaseOrder[],
  currentCashAdvance: number,
  totalCashAdvance: number,
): any => {
  return {
    current_cash_advance: currentCashAdvance,
    total_cash_advance: totalCashAdvance,
    purchase_order: po.map((e) => {
      return {
        id: e.id,
        cc: e.cc,
        po_number: e.po_number,
        item_description: e.item_description,
      };
    }),
  };
};

export const PurchaseOrderDetailResource = (po: PurchaseOrder): any => {
  return {
    id: Number(po.id),
    cc: po.cc,
    line_po_number: po.line_po_number ? po.line_po_number : '-',
    po_number: po.po_number ? po.po_number : '-',
    shipment_number: po.shipment_number ? po.shipment_number : '-',
    po_status: po.status ? po.status : '-',
    line_po_status:
      po.line_po_status && po.line_po_status == 1 ? 'Active' : 'Non Active',
    region: {
      id: po.region ? po.region.id : null,
      name: po.region ? po.region.name : '-',
    },
    area: {
      id: po.area ? po.area.id : null,
      name: po.area ? po.area.name : '-',
    },
    operator: {
      id: po.operator ? po.operator.id : null,
      name: po.operator ? po.operator.name : '-',
    },
    customer: {
      id: po.customer ? po.customer.id : null,
      name: po.customer ? po.customer.name : '-',
    },
    project: {
      id: po.project ? po.project.id : null,
      name: po.project ? po.project.name : '-',
      code: po.project ? po.project.code : '-',
    },
    site: {
      id: po.site ? po.site.id : null,
      name: po.site ? po.site.name : '-',
      code: po.site ? po.site.code : '-',
    },
    item_code: po.item_code ? po.item_code : '-',
    unit_price: po.unit_price ? Number(po.unit_price) : 0,
    item_description: po.item_description ? po.item_description : '-',
    unit_price_1: po.unit_price_1 ? Number(po.unit_price_1) : 0,
    unit_price_2: po.unit_price_2 ? Number(po.unit_price_2) : 0,
    requested_qty: po.requested_qty ? Number(po.requested_qty) : 0,
    billed_qty: po.billed_qty ? Number(po.billed_qty) : 0,
    due_qty: po.due_qty ? Number(po.due_qty) : 0,
    line_amount: po.line_amount ? Number(po.line_amount) : 0,
    remaining_from_po: po.remaining_from_po ? Number(po.remaining_from_po) : 0,
    unit: po.unit ? po.unit : '-',
    payment_terms: po.payment_terms ? po.payment_terms : '-',
    bidding_area: {
      id: po.bidding_area ? po.bidding_area.id : null,
      name: po.bidding_area ? po.bidding_area.name : '-',
    },
    publish_date: po.publish_date
      ? moment(po.publish_date).format('YYYY-MM-DD hh:mm:ss')
      : null,
    start_date: po.start_date
      ? moment(po.start_date).format('YYYY-MM-DD hh:mm:ss')
      : null,
    end_date: po.end_date
      ? moment(po.end_date).format('YYYY-MM-DD hh:mm:ss')
      : null,
    remark_weekly: po.remark_weekly ? po.remark_weekly : '-',
    remark_project: {
      id: po.remark_project ? po.remark_project.id : null,
      name: po.remark_project ? po.remark_project.name : '-',
    },
    remark_highlight: po.remark_highlight ? po.remark_highlight : '-',
    aging_po: po.publish_date ? moment().diff(po.publish_date, 'day') : '-',
    priority_esar_approve: po.priority_esar_approve
      ? po.priority_esar_approve
      : '-',
    status_acceptance: {
      id: po.status_acceptance ? po.status_acceptance.id : null,
      name: po.status_acceptance ? po.status_acceptance.name : '-',
    },
    pending_type: {
      id: po.pending_type ? po.pending_type.id : null,
      name: po.pending_type ? po.pending_type.name : '-',
    },
    pending_approval_pd: po.pending_approval_pd ? po.pending_approval_pd : '-',
    amount_pending_approval_pd: po.amount_pending_approval_pd
      ? Number(po.amount_pending_approval_pd)
      : 0,
    pd: {
      id: po.pd ? po.pd.id : null,
      name: po.pd ? po.pd.name : '-',
    },
    actual_completion_date_vs_to_pd: po.actual_completion_date
      ? moment(po.actual_completion_date).format('YYYY-MM-DD hh:mm:ss')
      : null,
    ready_invoice: po.ready_invoice ? po.ready_invoice : '-',
    amount_ready_invoice: po.amount_ready_invoice
      ? Number(po.amount_ready_invoice)
      : 0,
    invoices: po.po_invoice
      ? po.po_invoice.map((e) => {
          return {
            id: e.id,
            invoice_number: e.invoice_number,
            date: e.invoice_date
              ? moment(e.invoice_date).format('YYYY-MM-DD hh:mm:ss')
              : null,
            status: e.invoice_status,
            payment_date: e.payment_date
              ? moment(e.payment_date).format('YYYY-MM-DD hh:mm:ss')
              : null,
            supplier_tax_number: e.supplier_tax_number,
            supplier_tax_date: e.supplier_tax_date
              ? moment(e.supplier_tax_date).format('YYYY-MM-DD hh:mm:ss')
              : null,
            payment_amount: e.payment_amount ? Number(e.payment_amount) : 0,
            deduction_amount: e.deduction_amount
              ? Number(e.deduction_amount)
              : 0,
            unit_price: e.unit_price ? Number(e.unit_price) : 0,
          };
        })
      : [],
    budget_percentage: Number(po.budget_percentage),
  };
};
