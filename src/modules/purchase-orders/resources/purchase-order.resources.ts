import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import moment from 'moment';
import { exportUniqueId } from 'src/utils/encryption-helper';

export const PurchaseOrderResource = (po: PurchaseOrder): any => {
  return {
    id: po.id,
    unique_id: exportUniqueId(po.id, po.createdAtParseDate),
    cc: po.cc,
    po_number: po.po_number,
    line_po_status:
      po.line_po_status && po.line_po_status == 1 ? 'Active' : 'Non Active',
    region_name: po.region ? po.region.name : '-',
    project_name: po.project ? po.project.name : '-',
    status: po.status,
    area: {
      id: po.area ? po.area.id : null,
      name: po.area ? po.area.name : '-',
    },
    site: {
      id: po.site ? po.site.id : null,
      name: po.site ? po.site.name : '-',
      code: po.site ? po.site.code : '-',
    },
    customer: po.customer ? {
      id: po.customer.id,
      name: po.customer.name,
    } : null,
    item_description: po.item_description ? po.item_description : '-',
    remark_ss: po.remark_ss ? po.remark_ss : '-',
    start_progress_confirmed_by_rpm: po.start_progress_confirmed_by_rpm ? po.start_progress_confirmed_by_rpm : null,
    finish_progress_confirmed_by_rpm: po.finish_progress_confirmed_by_rpm ? po.finish_progress_confirmed_by_rpm : null,
    done_atp_confirmed_by_rpm: po.done_atp_confirmed_by_rpm ? po.done_atp_confirmed_by_rpm : null,
    remark_rpm: po.remark_rpm ? po.remark_rpm : '-',
    start_progress: po.start_progress
      ? moment(po.start_progress).format('YYYY-MM-DD HH:mm:ss')
      : null,
    finish_progress: po.finish_progress
      ? moment(po.finish_progress).format('YYYY-MM-DD HH:mm:ss')
      : null,
    done_atp: po.done_atp
      ? moment(po.done_atp).format('YYYY-MM-DD HH:mm:ss')
      : null,
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
        unique_id: exportUniqueId(e.id, e.createdAtParseDate),
        cc: e.cc,
        po_number: e.po_number,
        item_description: e.item_description,
        project_name: e.project ? e.project.name : '-',
        workload_ticket_id: e.workload_ticket_id ? e.workload_ticket_id : null,
      };
    }),
  };
};

export const PurchaseOrderDetailResource = (po: PurchaseOrder): any => {
  return {
    id: Number(po.id),
    unique_id: exportUniqueId(po.id, po.createdAtParseDate),
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
      ? moment(po.publish_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    start_date: po.start_date
      ? moment(po.start_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    end_date: po.end_date
      ? moment(po.end_date).format('YYYY-MM-DD HH:mm:ss')
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
      ? moment(po.actual_completion_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    ready_invoice: po.ready_invoice ? po.ready_invoice : '-',
    amount_ready_invoice: po.amount_ready_invoice
      ? Number(po.amount_ready_invoice)
      : 0,
    total_acceptance: po.total_acceptance ? po.total_acceptance : 0,
    ny_invoice: po.ny_invoice ? po.ny_invoice : 0,
    ny_invoice_date: po.ny_invoice_date
      ? moment(po.ny_invoice_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    piutang: po.piutang ? po.piutang : 0,
    priority_site_list: po.priority_site_list ? po.priority_site_list : '-',
    amount_priority: po.amount_priority ? po.amount_priority : 0,
    achievement_priority: po.achievement_priority ? po.achievement_priority : 0,
    actual_work_date: po.actual_work_date
      ? moment(po.actual_work_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    actual_work_amount: po.actual_work_amount ? po.actual_work_amount : 0,
    actual_work_status: po.actual_work_status ? po.actual_work_status : '-',
    remark_ss: po.remark_ss ? po.remark_ss : '-',
    remark_highlight_recon: po.remark_highlight_recon
      ? po.remark_highlight_recon
      : '-',
    pic: po.pic_data
      ? {
        id: po.pic_data.id,
        name: po.pic_data.name,
      }
      : null,
    plan_date: po.plan_date
      ? moment(po.plan_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    start_progress: po.start_progress
      ? moment(po.start_progress).format('YYYY-MM-DD HH:mm:ss')
      : null,
    finish_progress: po.finish_progress
      ? moment(po.finish_progress).format('YYYY-MM-DD HH:mm:ss')
      : null,
    done_atp: po.done_atp
      ? moment(po.done_atp).format('YYYY-MM-DD HH:mm:ss')
      : null,
    invoices: po.po_invoice
      ? [...po.po_invoice].sort((a, b) => {
          return (a.id || 0) - (b.id || 0);
      }).map((e) => {
        return {
          id: e.id,
          position: e.position ? Number(e.position) : 0,
          invoice_number: e.invoice_number,
          date: e.invoice_date
            ? moment(e.invoice_date).format('YYYY-MM-DD HH:mm:ss')
            : null,
          status: e.invoice_status,
          payment_date: e.payment_date
            ? moment(e.payment_date).format('YYYY-MM-DD HH:mm:ss')
            : null,
          supplier_tax_number: e.supplier_tax_number,
          supplier_tax_date: e.supplier_tax_date
            ? moment(e.supplier_tax_date).format('YYYY-MM-DD HH:mm:ss')
            : null,
          payment_amount: e.payment_amount ? Number(e.payment_amount) : 0,
          deduction_amount: e.deduction_amount
            ? Number(e.deduction_amount)
            : 0,
          unit_price: e.unit_price ? Number(e.unit_price) : 0,
          submit_date: e.submit_date
            ? moment(e.submit_date).format('YYYY-MM-DD HH:mm:ss')
            : null,
          submit_amount: e.submit_amount ? e.submit_amount : 0,
          approve_date: e.approve_date
            ? moment(e.approve_date).format('YYYY-MM-DD HH:mm:ss')
            : null,
          approve_amount: e.approve_amount ? e.approve_amount : 0,
        };
      })
      : [],
    budget_percentage: Number(po.budget_percentage),
  };
};
