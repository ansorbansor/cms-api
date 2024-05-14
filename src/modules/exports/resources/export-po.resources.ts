import moment from 'moment';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { exportUniqueId } from 'src/utils/encryption-helper';

export const ExportPOResource = (po: PurchaseOrder): any => {
  return {
    'Unique ID': exportUniqueId(po.id, po.createdAtParseDate),
    CC: po.cc,
    'Line PO Status':
      po.line_po_status && po.line_po_status == 1 ? 'Active' : 'Non Active',
    Region: po.region ? po.region.name : '-',
    Area: po.area ? po.area.name : '-',
    Operator: po.operator ? po.operator.name : '-',
    Customer: po.customer ? po.customer.name : '-',
    'Project Name': po.project ? po.project.name : '-',
    'Project Code': po.project ? po.project.code : '-',
    'Site Code': po.site ? po.site.code : '-',
    'Site Name': po.site ? po.site.name : '-',
    'Po Status': po.status ? po.status : '-',
    'PO No.': po.po_number ? po.po_number : '-',
    'PO Line No.': po.line_po_number ? po.line_po_number : '-',
    'Shipment No.': po.shipment_number ? po.shipment_number : '-',
    'Item Code': po.item_code ? po.item_code : '-',
    'Item Description': po.item_description ? po.item_description : '-',
    'Unit Price': po.unit_price ? Number(po.unit_price) : 0,
    'Unit Price 1 (100/60/70/80)': po.unit_price_1
      ? Number(po.unit_price_1)
      : 0,
    'Unit Price 2 (20/30/40)': po.unit_price_2 ? Number(po.unit_price_2) : 0,
    'Requested Qty': po.requested_qty ? Number(po.requested_qty) : 0,
    'Billed Qty': po.billed_qty ? Number(po.billed_qty) : 0,
    'Due Qty': po.due_qty ? Number(po.due_qty) : 0,
    'Line Amount': po.line_amount ? Number(po.line_amount) : 0,
    'Remaining from PO': po.remaining_from_po
      ? Number(po.remaining_from_po)
      : 0,
    Unit: po.unit ? po.unit : '-',
    'Payment Terms': po.payment_terms ? po.payment_terms : '-',
    'Bidding Area': po.bidding_area ? po.bidding_area.name : '-',
    'Publish Date': po.publish_date
      ? moment(po.publish_date).format('YYYY-MM-DD')
      : null,
    'Start Date': po.start_date
      ? moment(po.start_date).format('YYYY-MM-DD')
      : null,
    'End Date': po.end_date ? moment(po.end_date).format('YYYY-MM-DD') : null,
    'Priority ESAR Approve': po.priority_esar_approve
      ? po.priority_esar_approve
      : '-',
    'Remark Weekly': po.remark_weekly ? po.remark_weekly : '-',
    'Remark Project': po.remark_project ? po.remark_project.name : '-',
    'Status of Acceptance': po.status_acceptance
      ? po.status_acceptance.name
      : '-',
    'Pending Type': po.pending_type ? po.pending_type.name : '-',
    'Pending Approval PD': po.pending_approval_pd
      ? po.pending_approval_pd
      : '-',
    'Amount Pending approval PD': po.amount_pending_approval_pd
      ? Number(po.amount_pending_approval_pd)
      : 0,
    'PD name': po.pd ? po.pd.name : '-',
    'Ready Invoice': po.ready_invoice ? po.ready_invoice : '-',
    'Amount Ready Invoice': po.amount_ready_invoice
      ? Number(po.amount_ready_invoice)
      : 0,
    'Budget Percentage': Number(po.budget_percentage),
    'Remark Highlight': po.remark_highlight ? po.remark_highlight : '-',
    'Total Acceptance': po.total_acceptance ? Number(po.total_acceptance) : 0,
    'NY Invoice': po.ny_invoice ? Number(po.ny_invoice) : 0,
    'NY Invoice Date': po.ny_invoice_date
      ? moment(po.ny_invoice_date).format('YYYY-MM-DD')
      : null,
    Piutang: po.piutang ? Number(po.piutang) : 0,
    'Priority Site List': po.priority_site_list ? po.priority_site_list : '-',
    'Amount Priority': po.amount_priority ? Number(po.amount_priority) : 0,
    'Achievement Priority': po.achievement_priority
      ? Number(po.achievement_priority)
      : 0,
    'Actual Bulan Pengerjaan': po.actual_work_date
      ? moment(po.actual_work_date).format('YYYY-MM-DD')
      : null,
    'Actual Nilai Pengerjaan': po.actual_work_amount
      ? Number(po.actual_work_amount)
      : 0,
    'Status Actual Bulan Pengerjaan': po.actual_work_status
      ? po.actual_work_status
      : '-',
    'Remark Highlight Rekon': po.remark_highlight_recon
      ? po.remark_highlight_recon
      : '-',
    PIC: po.pic_data && po.pic_data.name ? po.pic_data.name : '-',
    'Plan Date': po.plan_date
      ? moment(po.plan_date).format('YYYY-MM-DD')
      : null,
    invoices: po.po_invoice
      ? po.po_invoice.map((e) => {
        return {
          invoice_number: e.invoice_number,
          date: e.invoice_date
            ? moment(e.invoice_date).format('YYYY-MM-DD')
            : null,
          status: e.invoice_status,
          payment_date: e.payment_date
            ? moment(e.payment_date).format('YYYY-MM-DD')
            : null,
          supplier_tax_number: e.supplier_tax_number,
          supplier_tax_date: e.supplier_tax_date
            ? moment(e.supplier_tax_date).format('YYYY-MM-DD')
            : null,
          payment_amount: e.payment_amount ? e.payment_amount : 0,
          deduction_amount: e.deduction_amount ? e.deduction_amount : 0,
          unit_price: e.unit_price ? e.unit_price : 0,
          submit_date: e.submit_date
            ? moment(e.submit_date).format('YYYY-MM-DD')
            : null,
          submit_amount: e.submit_amount ? e.submit_amount : 0,
          approve_date: e.approve_date
            ? moment(e.approve_date).format('YYYY-MM-DD')
            : null,
          approve_amount: e.approve_amount ? e.approve_amount : 0,
        };
      })
      : [],
    'Delete Data': '',
  };
};
