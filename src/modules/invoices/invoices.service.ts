import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { Customer } from 'src/entities/customer.entity';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';
import moment from 'moment';

function toRoman(month: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[month - 1] || 'I';
}

function terbilangAngka(n: number): string {
  const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  n = Math.floor(Math.abs(n));
  if (n < 12) return angka[n];
  if (n < 20) return (terbilangAngka(n - 10) + ' Belas').trim();
  if (n < 100) return (terbilangAngka(Math.floor(n / 10)) + ' Puluh ' + terbilangAngka(n % 10)).trim();
  if (n < 200) return ('Seratus ' + terbilangAngka(n - 100)).trim();
  if (n < 1000) return (terbilangAngka(Math.floor(n / 100)) + ' Ratus ' + terbilangAngka(n % 100)).trim();
  if (n < 2000) return ('Seribu ' + terbilangAngka(n - 1000)).trim();
  if (n < 1000000) return (terbilangAngka(Math.floor(n / 1000)) + ' Ribu ' + terbilangAngka(n % 1000)).trim();
  if (n < 1000000000) return (terbilangAngka(Math.floor(n / 1000000)) + ' Juta ' + terbilangAngka(n % 1000000)).trim();
  if (n < 1000000000000) return (terbilangAngka(Math.floor(n / 1000000000)) + ' Milyar ' + terbilangAngka(n % 1000000000)).trim();
  return (terbilangAngka(Math.floor(n / 1000000000000)) + ' Triliun ' + terbilangAngka(n % 1000000000000)).trim();
}

export function terbilangRupiah(n: number): string {
  if (!n || n === 0) return 'Nol Rupiah';
  const hasil = terbilangAngka(n).replace(/\s+/g, ' ');
  return `${hasil} Rupiah`;
}

export function extractUnitFromDescription(desc: string, currentUnit?: string): string {
  if (currentUnit && currentUnit !== '-' && currentUnit.trim() !== '') {
    return currentUnit.toLowerCase().trim();
  }
  if (!desc) return 'each';
  const match = desc.match(/\d+[\s,.]*\b(each|meter|lot|set|roll|pcs|unit|box)\b/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return 'each';
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(PurchaseOrderInvoice)
    private readonly invoiceRepository: Repository<PurchaseOrderInvoice>,
  ) {}

  /**
   * List POs that are eligible for invoicing (have col_gr_number_xls_inhouse populated)
   */
  async getEligiblePOs(search?: string) {
    const qb = this.poRepository
      .createQueryBuilder('po')
      .leftJoin('po.customer', 'customer')
      .leftJoin('po.project', 'project')
      .select('po.po_number', 'po_number')
      .addSelect('MAX(po.publish_date)', 'publish_date')
      .addSelect('MAX(po.payment_terms)', 'payment_terms')
      .addSelect('MAX(customer.name)', 'customer_name')
      .addSelect('MAX(customer.code)', 'customer_code')
      .addSelect('MAX(project.name)', 'project_name')
      .addSelect('COUNT(po.id)', 'total_rows')
      .addSelect('COUNT(DISTINCT po.line_po_number)', 'total_lines')
      .where("po.col_gr_number_xls_inhouse IS NOT NULL AND TRIM(po.col_gr_number_xls_inhouse) != ''")
      .andWhere("po.po_number IS NOT NULL AND TRIM(po.po_number) != ''");

    if (search && search.trim() !== '') {
      qb.andWhere(
        '(LOWER(po.po_number) LIKE :s OR LOWER(customer.name) LIKE :s OR LOWER(project.name) LIKE :s)',
        { s: `%${search.toLowerCase().trim()}%` },
      );
    }

    qb.groupBy('po.po_number').orderBy('MAX(po.publish_date)', 'DESC');

    const raw = await qb.getRawMany();
    return raw;
  }

  /**
   * Generate Invoice Preview Data for a given PO number
   */
  async getInvoicePreview(poNumber: string, options?: {
    invoice_date?: string;
    invoice_number?: string;
    milestone_pct?: number;
    term_label?: string;
  }) {
    // 1. Fetch all rows of this PO with GR
    const poRows = await this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.customer', 'customer')
      .leftJoinAndSelect('po.project', 'project')
      .where('po.po_number = :poNumber', { poNumber })
      .andWhere("po.col_gr_number_xls_inhouse IS NOT NULL AND TRIM(po.col_gr_number_xls_inhouse) != ''")
      .orderBy('CAST(NULLIF(regexp_replace(po.line_po_number, \'\\D\', \'\', \'g\'), \'\') AS INTEGER)', 'ASC')
      .getMany();

    if (!poRows || poRows.length === 0) {
      // Fallback: check if PO exists without GR
      const anyRows = await this.poRepository.find({ where: { po_number: poNumber } });
      if (!anyRows || anyRows.length === 0) {
        throw new NotFoundException(`Purchase Order ${poNumber} tidak ditemukan.`);
      }
      throw new NotFoundException(
        `Purchase Order ${poNumber} ditemukan, namun belum memiliki Nomor GR (Good Receipt). Silakan lengkapi Nomor GR terlebih dahulu.`,
      );
    }

    const firstRow = poRows[0];
    const customer = firstRow.customer;
    const project = firstRow.project;

    // Determine Dates
    const today = moment();
    const invoiceDateStr = options?.invoice_date || today.format('YYYY-MM-DD');
    const invoiceDateFormatted = moment(invoiceDateStr).format('D-MMM-YY');
    const poDateFormatted = firstRow.publish_date
      ? moment(firstRow.publish_date).format('YYYY-MM-DD')
      : '2026-06-18';

    // Customer details with fallbacks
    const custCode = customer?.code || 'XLS';
    const custName = customer?.name || 'PT. XLSMART Telecom Sejahtera Tbk';
    const custAddress = customer?.address ||
      'Gedung XLSmart Tower, JL HR. Rasuna Said Kav 11-12, Block X-5 RT. 007 RW. 002 Kuningan Timur, Setiabudi, Kota Adm. Jakarta Selatan, DKI Jakarta, 12950';
    const custNpwp = customer?.npwp || '0013452768092000';

    // Invoice Number generation (e.g. 100/XLS/BSN/X/2026)
    const romanMonth = toRoman(moment(invoiceDateStr).month() + 1);
    const invoiceYear = moment(invoiceDateStr).year();
    let invoiceNumber = options?.invoice_number?.trim();

    if (!invoiceNumber) {
      // Find the next available sequence number for this pattern so the default is unique
      const patternSuffix = `/${custCode}/BSN/${romanMonth}/${invoiceYear}`;
      const existingInvs = await this.invoiceRepository
        .createQueryBuilder('poi')
        .select('DISTINCT poi.invoice_number', 'invoice_number')
        .where('poi.invoice_number LIKE :pattern', { pattern: `%${patternSuffix}` })
        .getRawMany();

      let nextSeq = 100;
      if (existingInvs && existingInvs.length > 0) {
        const seqs = existingInvs
          .map((r) => {
            const match = String(r.invoice_number).match(/^(\d+)\//);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((n) => !isNaN(n) && n > 0);

        if (seqs.length > 0) {
          nextSeq = Math.max(...seqs) + 1;
        }
      }

      invoiceNumber = `${nextSeq}${patternSuffix}`;
    }

    // Check if the current invoice number already exists in DB
    const invoiceNumberCheck = await this.checkInvoiceNumber(invoiceNumber, poNumber);

    // Determine milestone percentage from payment_terms or default
    let milestonePct = options?.milestone_pct;
    if (milestonePct === undefined || milestonePct === null) {
      // Try parsing from payment_terms (e.g., '60% RFS/ 40% ATP' -> 40%)
      const terms = firstRow.payment_terms || '';
      if (terms.includes('40%')) {
        milestonePct = 40;
      } else if (terms.includes('60%')) {
        milestonePct = 60;
      } else if (terms.includes('100%')) {
        milestonePct = 100;
      } else {
        milestonePct = 40; // Default
      }
    }

    // Group rows by line_po_number
    const lineMap = new Map<string, typeof poRows>();
    for (const row of poRows) {
      const lineKey = String(row.line_po_number || '1');
      if (!lineMap.has(lineKey)) {
        lineMap.set(lineKey, []);
      }
      lineMap.get(lineKey).push(row);
    }

    // Sort lines numerically
    const sortedLineKeys = Array.from(lineMap.keys()).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    const items = [];
    let totalPrice = 0;
    let totalRequestedQty = 0;
    let itemNo = 1;

    for (const lineKey of sortedLineKeys) {
      const rows = lineMap.get(lineKey);
      const rep = rows[0];

      // Sum requested_qty of GR items under this line
      const totalQty = rows.reduce((acc, r) => acc + (Number(r.requested_qty) || 0), 0);
      const unitPrice = Number(rep.unit_price) || 0;
      const linePrice = unitPrice * totalQty;
      const lineAmount = Math.round(linePrice * (milestonePct / 100));

      // Collect all distinct GR numbers with their requested_qty
      const grSet = new Set<string>();
      const grItems: Array<{ po_id: number; gr_number: string; requested_qty: number }> = [];
      const grQtyMap: Record<string, number> = {};

      for (const r of rows) {
        if (r.col_gr_number_xls_inhouse) {
          const splitGrs = r.col_gr_number_xls_inhouse.split('|');
          const rowReqQty = Number(r.requested_qty) || 0;
          const qtyPerGr = splitGrs.length > 0 ? rowReqQty / splitGrs.length : rowReqQty;
          for (const g of splitGrs) {
            const cleanG = g.trim();
            if (cleanG) {
              grSet.add(cleanG);
              const grQty = splitGrs.length === 1 ? rowReqQty : qtyPerGr;
              grItems.push({
                po_id: r.id,
                gr_number: cleanG,
                requested_qty: grQty,
              });
              grQtyMap[cleanG] = (grQtyMap[cleanG] || 0) + grQty;
            }
          }
        }
      }
      const grString = Array.from(grSet).join('|');

      const unit = extractUnitFromDescription(rep.item_description, rep.unit);

      const itemPoNumber = String(rep.po_number || poNumber);
      const itemLinePoNumber = String(rep.line_po_number || lineKey);
      const poLineValue = `${itemPoNumber}-${itemLinePoNumber}`;

      items.push({
        no: itemNo++,
        po_id: rep.id,
        po_ids: rows.map((r) => r.id),
        po_number: itemPoNumber,
        line_po_number: itemLinePoNumber,
        po_line: poLineValue,
        description: rep.item_description || `Item Line ${itemLinePoNumber}`,
        no_gr: grString,
        gr_items: grItems,
        gr_qty_map: grQtyMap,
        unit_price: unitPrice,
        requested_qty: totalQty,
        qty: totalQty,
        unit: unit,
        price: linePrice,
        milestone_pct: milestonePct,
        amount: lineAmount,
      });

      totalPrice += linePrice;
      totalRequestedQty += totalQty;
    }

    // Financial calculations
    const paymentAmount = Math.round(totalPrice * (milestonePct / 100));
    const vatPct = 11; // Flat 11%
    const vatAmount = Math.round(paymentAmount * (vatPct / 100));
    const totalPayment = paymentAmount + vatAmount;
    const terbilang = terbilangRupiah(totalPayment);

    return {
      invoice_info: {
        invoice_number: invoiceNumber,
        is_invoice_number_taken: invoiceNumberCheck.exists,
        invoice_number_conflict: invoiceNumberCheck.exists ? invoiceNumberCheck.details : null,
        invoice_date: invoiceDateFormatted,
        invoice_date_raw: invoiceDateStr,
        po_number: poNumber,
        po_date: poDateFormatted,
        project_name: project?.name || 'SF|Network Service Inhouse',
      },
      customer_info: {
        id: customer?.id,
        name: custName,
        code: custCode,
        address: custAddress,
        npwp: custNpwp,
      },
      company_info: {
        name: 'PT BIOSRON',
        address: 'Jl. Jati Mekar B5 No 13 Margaasih\nBandung 40215',
        bank_name: 'PT. Bank CIMBNiaga',
        bank_address: 'Cabang Setiabudi Bandung',
        swift_code: 'BNIAIDJA',
        beneficiary_name: 'PT BIOSRON',
        account_number: '800190009600 (IDR)',
        signatory_city: 'Bandung',
        signatory_date: moment(invoiceDateStr).format('DD MMMM YYYY'),
        signatory_name: 'BIMA RIKARSON',
        signatory_title: 'Director',
      },
      items,
      totals: {
        total_qty: totalRequestedQty,
        total_price: totalPrice,
        milestone_pct: milestonePct,
        term_label: options?.term_label || `PAYMENT TERM - 1 (${milestonePct}%)`,
        payment_term_1_label: `PAYMENT TERM - 1 (${milestonePct}%)`,
        payment_amount: paymentAmount,
        vat_pct: vatPct,
        vat_amount: vatAmount,
        total_payment: totalPayment,
        terbilang: terbilang,
      },
    };
  }

  /**
   * Check if an official invoice number already exists in purchase_order_invoices
   */
  async checkInvoiceNumber(invoiceNumber: string, currentPoNumber?: string) {
    if (!invoiceNumber || invoiceNumber.trim() === '') {
      return { exists: false, invoice_number: '' };
    }

    const cleanNumber = invoiceNumber.trim();
    const row = await this.invoiceRepository
      .createQueryBuilder('poi')
      .leftJoin('poi.po', 'po')
      .leftJoin('po.customer', 'customer')
      .select('poi.invoice_number', 'invoice_number')
      .addSelect('MIN(poi.id)', 'id')
      .addSelect('MAX(poi.invoice_date)', 'invoice_date')
      .addSelect('MAX(poi.invoice_status)', 'invoice_status')
      .addSelect('MAX(po.po_number)', 'po_number')
      .addSelect('MAX(customer.name)', 'customer_name')
      .addSelect('SUM(poi.payment_amount)', 'total_payment')
      .addSelect('COUNT(poi.id)', 'line_count')
      .where('LOWER(TRIM(poi.invoice_number)) = LOWER(TRIM(:cleanNumber))', { cleanNumber })
      .groupBy('poi.invoice_number')
      .getRawOne();

    if (!row) {
      return {
        exists: false,
        invoice_number: cleanNumber,
      };
    }

    return {
      exists: true,
      invoice_number: row.invoice_number,
      details: {
        id: row.id,
        po_number: row.po_number,
        invoice_date: row.invoice_date,
        invoice_status: row.invoice_status || 'Generated',
        customer_name: row.customer_name,
        total_payment: Number(row.total_payment) || 0,
        line_count: Number(row.line_count) || 1,
        is_same_po: currentPoNumber ? String(row.po_number).trim() === String(currentPoNumber).trim() : false,
      },
    };
  }

  /**
   * Save Generated Invoice to purchase_order_invoices
   * Handles multi-line POs: creates a record for each active/billed line of the PO.
   */
  async saveInvoice(payload: {
    po_number: string;
    invoice_number: string;
    invoice_date: string;
    payment_amount: number;
    unit_price?: number;
    user_id?: number;
    milestone_pct?: number;
    lines?: Array<{
      line_po_number: string;
      po_number?: string;
      po_id?: number;
      po_ids?: number[];
      qty?: number;
      unit_price?: number;
      amount?: number;
      price?: number;
      active_grs?: string[];
      gr_items?: Array<{ po_id?: number; gr_number: string; requested_qty?: number }>;
    }>;
  }) {
    const cleanInvoiceNumber = payload.invoice_number ? payload.invoice_number.trim() : '';
    if (!cleanInvoiceNumber) {
      throw new BadRequestException('Nomor Invoice Resmi wajib diisi.');
    }

    // STRICT CHECK: Reject if this official invoice number already exists in purchase_order_invoices
    // No invoice number can ever be sent twice, even for different components or different POs!
    const duplicateCheck = await this.checkInvoiceNumber(cleanInvoiceNumber, payload.po_number);
    if (duplicateCheck.exists) {
      const d = duplicateCheck.details;
      const formattedDate = d?.invoice_date ? moment(d.invoice_date).format('DD-MMM-YYYY') : '';
      const formattedAmount = d?.total_payment ? 'Rp. ' + Number(d.total_payment).toLocaleString('id-ID') : '';
      throw new ConflictException(
        `Nomor Invoice Resmi '${cleanInvoiceNumber}' SUDAH PERNAH DIGUNAKAN di sistem SIMPRO (tercatat pada PO: ${d?.po_number || '-'}, Tanggal: ${formattedDate || '-'}, Total: ${formattedAmount || '-'}). Nomor invoice resmi tidak boleh dikirim/disimpan dua kali.`
      );
    }

    const userId = payload.user_id ? Number(payload.user_id) : 1;
    const invDate = payload.invoice_date ? new Date(payload.invoice_date) : new Date();

    // 1. Fetch all rows of this PO from purchase_orders
    const poRows = await this.poRepository.find({
      where: { po_number: payload.po_number },
      order: { id: 'ASC' },
    });

    if (!poRows || poRows.length === 0) {
      throw new NotFoundException(`Purchase Order ${payload.po_number} tidak ditemukan.`);
    }

    // Map rows by line_po_number
    const rowsByLine = new Map<string, typeof poRows>();
    for (const r of poRows) {
      const lineKey = String(r.line_po_number || '1');
      if (!rowsByLine.has(lineKey)) rowsByLine.set(lineKey, []);
      rowsByLine.get(lineKey).push(r);
    }

    // 2. Prepare records to insert into purchase_order_invoices for each included line
    const recordsToInsert = [];

    if (payload.lines && payload.lines.length > 0) {
      // Use active lines sent from generator
      for (const line of payload.lines) {
        let targetPoId = line.po_id;
        if (!targetPoId) {
          const matchingRows = rowsByLine.get(String(line.line_po_number)) || [];
          if (matchingRows.length > 0) {
            targetPoId = matchingRows[0].id;
          } else {
            targetPoId = poRows[0].id;
          }
        }

        const lineAmount =
          line.amount !== undefined
            ? Number(line.amount)
            : Math.round(Number(line.unit_price || 0) * Number(line.qty || 1));
        const lineUnitPrice = line.unit_price !== undefined ? Number(line.unit_price) : 0;

        recordsToInsert.push({
          invoice_number: payload.invoice_number,
          invoice_date: invDate,
          invoice_status: 'Generated',
          purchase_order_id: String(targetPoId),
          payment_amount: lineAmount,
          submit_amount: lineAmount,
          unit_price: lineUnitPrice,
          user_id: userId,
          submit_date: invDate,
        });
      }
    } else {
      // Fallback: auto-create records for lines of this PO that have GR (or all lines if none have GR)
      const hasAnyGr = poRows.some((r) => !!r.col_gr_number_xls_inhouse);
      const eligibleRows = hasAnyGr
        ? poRows.filter((r) => !!r.col_gr_number_xls_inhouse)
        : poRows;

      const fallbackLineMap = new Map<string, typeof poRows>();
      for (const r of eligibleRows) {
        const lineKey = String(r.line_po_number || '1');
        if (!fallbackLineMap.has(lineKey)) fallbackLineMap.set(lineKey, []);
        fallbackLineMap.get(lineKey).push(r);
      }

      const msPct = payload.milestone_pct || 40;
      for (const [lineKey, rows] of fallbackLineMap.entries()) {
        const rep = rows[0];
        const lineQty = rows.reduce((acc, r) => acc + (Number(r.requested_qty) || 0), 0);
        const unitPrice = Number(rep.unit_price) || 0;
        const linePrice = unitPrice * lineQty;
        const lineAmount = Math.round(linePrice * (msPct / 100));

        recordsToInsert.push({
          invoice_number: payload.invoice_number,
          invoice_date: invDate,
          invoice_status: 'Generated',
          purchase_order_id: String(rep.id),
          payment_amount: lineAmount,
          submit_amount: lineAmount,
          unit_price: unitPrice,
          user_id: userId,
          submit_date: invDate,
        });
      }
    }

    // 3. Batch insert all line records
    if (recordsToInsert.length > 0) {
      const entities = this.invoiceRepository.create(recordsToInsert);
      await this.invoiceRepository.save(entities);
    }

    return {
      message: `Invoice ${payload.invoice_number} berhasil disimpan dengan ${recordsToInsert.length} line PO record`,
      invoice_number: payload.invoice_number,
      total_lines_saved: recordsToInsert.length,
      records: recordsToInsert,
    };
  }

  /**
   * Get list of saved invoices from purchase_order_invoices
   * Aggregates by invoice_number so each invoice is displayed with its combined total and line count.
   */
  async getInvoiceHistory(poNumber?: string) {
    const qb = this.invoiceRepository
      .createQueryBuilder('poi')
      .leftJoin('poi.po', 'po')
      .leftJoin('po.customer', 'customer')
      .leftJoin('po.project', 'project')
      .select('poi.invoice_number', 'invoice_number')
      .addSelect('MIN(poi.id)', 'id')
      .addSelect('MAX(poi.invoice_date)', 'invoice_date')
      .addSelect('MAX(poi.invoice_status)', 'invoice_status')
      .addSelect('MAX(po.po_number)', 'po_number')
      .addSelect('MAX(customer.name)', 'customer_name')
      .addSelect('MAX(project.name)', 'project_name')
      .addSelect('SUM(poi.payment_amount)', 'payment_amount')
      .addSelect('COUNT(poi.id)', 'line_count')
      .where("poi.invoice_number IS NOT NULL AND TRIM(poi.invoice_number) != ''");

    if (poNumber) {
      qb.andWhere('po.po_number = :poNumber', { poNumber });
    }

    qb.groupBy('poi.invoice_number')
      .orderBy('MAX(poi.created_at)', 'DESC')
      .take(50);

    const rawList = await qb.getRawMany();

    return rawList.map((r) => ({
      id: r.id,
      invoice_number: r.invoice_number,
      invoice_date: r.invoice_date,
      invoice_status: r.invoice_status || 'Generated',
      payment_amount: Number(r.payment_amount) || 0,
      line_count: Number(r.line_count) || 1,
      po: {
        po_number: r.po_number,
        customer: { name: r.customer_name },
        project: { name: r.project_name },
      },
    }));
  }
}
