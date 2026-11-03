import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { Customer } from 'src/entities/customer.entity';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';
import { POCustomColumn } from 'src/entities/po-custom-column.entity';
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

export function extractAnchorsFromRow(
  row: any,
  targetColumn?: string,
  customColumnDefs?: Array<{ name: string; label: string }>,
): Array<{
  gr_number: string;
  anchor_value: string;
  source_column: string;
  source_label: string;
}> {
  const result: Array<{
    gr_number: string;
    anchor_value: string;
    source_column: string;
    source_label: string;
  }> = [];

  const defaultDefs = customColumnDefs || [
    { name: 'col_gr_number_1_xls_inhouse', label: 'GR Number 1 (Term 1)' },
    { name: 'col_gr_number_2_xls_inhouse', label: 'GR Number 2 (Term 2)' },
    { name: 'col_gr_number_xls_inhouse', label: 'GR Number (XLS Inhouse)' },
  ];

  if (targetColumn && targetColumn !== 'all' && targetColumn !== 'all_gr' && targetColumn !== 'all_custom') {
    const rawVal = row[targetColumn];
    if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
      const parts = String(rawVal).split(/[|,]/);
      for (const p of parts) {
        const clean = p.trim();
        if (clean) {
          const foundDef = defaultDefs.find((d) => d.name === targetColumn);
          const lbl = foundDef ? foundDef.label : targetColumn;
          result.push({
            gr_number: clean,
            anchor_value: clean,
            source_column: targetColumn,
            source_label: lbl,
          });
        }
      }
    }
  } else {
    // Mode 'all': scan all registered custom columns from PO
    for (const def of defaultDefs) {
      const rawVal = row[def.name];
      if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
        const parts = String(rawVal).split(/[|,]/);
        for (const p of parts) {
          const clean = p.trim();
          if (clean) {
            result.push({
              gr_number: clean,
              anchor_value: clean,
              source_column: def.name,
              source_label: def.label,
            });
          }
        }
      }
    }
  }

  return result;
}

export const extractGrsFromRow = extractAnchorsFromRow;

/**
 * Deduce Payment Term Position (1 or 2) from custom column name or label.
 * Rules:
 *  - GR 1 / Term 1 -> Position 1 (e.g. 60% RFS / 40% ATP)
 *  - GR 2 / Term 2 -> Position 2 (e.g. 40% Term 2 / 30% ATP)
 */
export function getGrTermPosition(colName?: string, label?: string): number {
  const str = `${colName || ''} ${label || ''}`.toLowerCase();
  // Robust check for Term 2 / GR 2 (e.g. col_gr_number_2_..., GR Number 2, Nomor GR 2, Term 2, etc.)
  if (
    /(?:gr|term|nomor|number|no|pos|ke)[^1-9]*2(?!\d)/i.test(str) ||
    /(?:^|[_\s-])2(?:[_\s-]|$)/.test(str)
  ) {
    return 2;
  }
  // Check for Term 1 / GR 1
  if (
    /(?:gr|term|nomor|number|no|pos|ke)[^1-9]*1(?!\d)/i.test(str) ||
    /(?:^|[_\s-])1(?:[_\s-]|$)/.test(str)
  ) {
    return 1;
  }
  return 1;
}

@Injectable()
export class InvoicesService implements OnModuleInit {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(PurchaseOrderInvoice)
    private readonly invoiceRepository: Repository<PurchaseOrderInvoice>,
    @InjectRepository(POCustomColumn)
    private readonly poCustomColumnRepo: Repository<POCustomColumn>,
  ) {}

  async onModuleInit() {
    // Service initialized safely without modifying database schema
  }

  /**
   * Helper to query actual existing column names in purchase_orders table from information_schema
   */
  async getDbColumnNames(): Promise<Set<string>> {
    try {
      const dbColumns: Array<{ column_name: string }> = await this.poRepository.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_orders';
      `);
      return new Set(dbColumns.map((c) => c.column_name.toLowerCase()));
    } catch (e: any) {
      return new Set(this.poRepository.metadata.columns.map((c) => c.databaseName.toLowerCase()));
    }
  }

  /**
   * Return exclusively the custom columns created in pages/po/index.js (from po_custom_columns table)
   * that physically exist in the purchase_orders table.
   * Internal system columns (site_id, item_code, etc.) are strictly excluded.
   */
  async getAnchorColumns() {
    // 1. Fetch custom columns created in PO management (po_custom_columns)
    let customCols: POCustomColumn[] = [];
    try {
      customCols = await this.poCustomColumnRepo.find({
        order: { order_index: 'ASC', id: 'ASC' },
      });
    } catch (e: any) {
      console.warn('Failed to query po_custom_columns:', e.message);
      customCols = [];
    }

    // 2. Query physically existing columns in PostgreSQL purchase_orders
    const existingDbCols = await this.getDbColumnNames();

    // 3. Keep only custom columns that physically exist on purchase_orders
    const validCustomCols = customCols.filter((c) =>
      c.column_name && existingDbCols.has(c.column_name.toLowerCase().trim()),
    );

    const columnOptions = [];

    // Provide the composite "all" option at top representing ALL custom PO columns
    if (validCustomCols.length > 0) {
      columnOptions.push({
        key: 'all',
        column_name: 'all',
        display_label: '⚡ Semua Kolom GR (Gabungan / Otomatis)',
        header_title: 'NO GR',
        description: 'Menggabungkan data dari seluruh kolom GR yang dibuat pada Purchase Order',
        badge: 'ALL GR',
        is_gr_based: true,
        is_default: true,
        priority: 0,
        group: 'custom',
        group_label: '🔧 Kolom GR Purchase Orders',
      });
    }

    // Build options for each custom column created in po/index.js
    for (const c of validCustomCols) {
      const colName = c.column_name.trim();
      const displayLabel = c.display_label?.trim() || colName;
      const headerTitle = displayLabel.toUpperCase();

      columnOptions.push({
        key: colName,
        column_name: colName,
        display_label: displayLabel,
        header_title: headerTitle,
        description: `Berdasarkan data kolom kustom '${displayLabel}' pada Purchase Order`,
        badge: 'Custom',
        is_gr_based: true,
        is_default: false,
        priority: 10,
        group: 'custom',
        group_label: '🔧 Kolom Kustom Purchase Orders',
        data_type: c.data_type,
      });
    }

    // Sort by priority
    columnOptions.sort((a, b) => a.priority - b.priority);

    return columnOptions;
  }

  /**
   * Alias for backward compatibility
   */
  async getGrColumns() {
    return this.getAnchorColumns();
  }

  /**
   * List POs that are eligible for invoicing
   * Filters POs having non-empty values in the selected anchor column.
   */
  async getEligiblePOs(search?: string, anchorColumn?: string) {
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
      .addSelect('COUNT(DISTINCT po.line_po_number)', 'total_lines');

    const col = anchorColumn || 'all';
    const existingCols = await this.getDbColumnNames();

    let customCols: POCustomColumn[] = [];
    try {
      customCols = await this.poCustomColumnRepo.find();
    } catch (e) {
      customCols = [];
    }

    const validCustomColNames = customCols
      .map((c) => c.column_name)
      .filter((c) => c && existingCols.has(c.toLowerCase()));

    // Dynamically aggregate custom column values (e.g. GR numbers) per PO
    validCustomColNames.forEach((c) => {
      qb.addSelect(
        `STRING_AGG(DISTINCT NULLIF(TRIM(CAST(po."${c}" AS TEXT)), ''), ', ')`,
        `custom_${c}`,
      );
    });

    if (col === 'all' || col === 'all_gr' || col === 'all_custom') {
      const candidates = validCustomColNames;

      if (candidates.length > 0) {
        const clauses = candidates.map((c) => `(po."${c}" IS NOT NULL AND TRIM(CAST(po."${c}" AS TEXT)) != '')`);
        qb.where(`(${clauses.join(' OR ')})`);
      } else {
        qb.where('1 = 1');
      }
    } else {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, '');
      if (existingCols.has(safeCol.toLowerCase())) {
        qb.where(`po."${safeCol}" IS NOT NULL AND TRIM(CAST(po."${safeCol}" AS TEXT)) != ''`);
      }
    }

    qb.andWhere("po.po_number IS NOT NULL AND TRIM(po.po_number) != ''");

    // Search across PO Number, Customer, Project, AND all custom columns (GR 1, GR 2, BAST, etc.)
    if (search && search.trim() !== '') {
      const sVal = `%${search.toLowerCase().trim()}%`;
      const searchTerms = [
        'LOWER(po.po_number) LIKE :s',
        'LOWER(customer.name) LIKE :s',
        'LOWER(project.name) LIKE :s',
      ];
      validCustomColNames.forEach((c) => {
        searchTerms.push(`LOWER(CAST(po."${c}" AS TEXT)) LIKE :s`);
      });
      qb.andWhere(`(${searchTerms.join(' OR ')})`, { s: sVal });
    }

    qb.groupBy('po.po_number').orderBy('MAX(po.publish_date)', 'DESC');
    qb.limit(search ? 30 : 100);

    const raw = await qb.getRawMany();

    const colLabelMap = new Map<string, string>();
    customCols.forEach((c) => {
      colLabelMap.set(c.column_name, c.display_label || c.column_name);
    });

    return raw.map((r) => {
      const customValues: Array<{ column: string; label: string; value: string }> = [];
      validCustomColNames.forEach((c) => {
        const val = r[`custom_${c}`];
        if (val) {
          customValues.push({
            column: c,
            label: colLabelMap.get(c) || c,
            value: val,
          });
        }
      });
      return {
        ...r,
        custom_values: customValues,
      };
    });
  }

  /**
   * Generate Invoice Preview Data for a given PO number
   */
  async getInvoicePreview(poNumber: string, options?: {
    invoice_date?: string;
    invoice_number?: string;
    milestone_pct?: number;
    term_label?: string;
    gr_column?: string;
    anchor_column?: string;
  }) {
    const targetAnchor = options?.anchor_column || options?.gr_column || 'all';

    // Get anchor metadata from getAnchorColumns()
    const allAnchorCols = await this.getAnchorColumns();
    const anchorDef = allAnchorCols.find(
      (c) => c.key === targetAnchor || c.column_name === targetAnchor,
    ) || {
      key: targetAnchor,
      column_name: targetAnchor,
      display_label: targetAnchor,
      header_title: targetAnchor.toUpperCase(),
      is_gr_based: true,
    };

    const isGrBased = true;

    // Fetch dynamic custom column definitions from po_custom_columns
    let customCols: POCustomColumn[] = [];
    try {
      customCols = await this.poCustomColumnRepo.find();
    } catch (e) {
      customCols = [];
    }

    const previewExistingCols = await this.getDbColumnNames();
    const validCustomDefs = customCols
      .filter((c) => c.column_name && previewExistingCols.has(c.column_name.toLowerCase()))
      .map((c) => ({
        name: c.column_name,
        label: c.display_label || c.column_name,
      }));

    // 1. Fetch all rows of this PO matching the anchor criteria
    const qb = this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.customer', 'customer')
      .leftJoinAndSelect('po.project', 'project')
      .where('po.po_number = :poNumber', { poNumber });

    // Always select all physically existing custom columns from PO management
    validCustomDefs.forEach((d) => {
      qb.addSelect(`po."${d.name}"`, d.name);
    });

    if (targetAnchor === 'all' || targetAnchor === 'all_gr' || targetAnchor === 'all_custom') {
      const candidates = validCustomDefs.map((d) => d.name);
      if (candidates.length > 0) {
        const clauses = candidates.map((c) => `(po."${c}" IS NOT NULL AND TRIM(CAST(po."${c}" AS TEXT)) != '')`);
        qb.andWhere(`(${clauses.join(' OR ')})`);
      }
    } else {
      const safeCol = targetAnchor.replace(/[^a-zA-Z0-9_]/g, '');
      if (previewExistingCols.has(safeCol.toLowerCase())) {
        if (!validCustomDefs.some((d) => d.name === safeCol)) {
          qb.addSelect(`po."${safeCol}"`, safeCol);
        }
        qb.andWhere(`po."${safeCol}" IS NOT NULL AND TRIM(CAST(po."${safeCol}" AS TEXT)) != ''`);
      }
    }

    qb.orderBy('CAST(NULLIF(regexp_replace(po.line_po_number, \'\\D\', \'\', \'g\'), \'\') AS INTEGER)', 'ASC');

    let poRows: PurchaseOrder[] = [];
    const { entities, raw } = await qb.getRawAndEntities();
    entities.forEach((entity, idx) => {
      const rawRow = raw[idx];
      if (rawRow) {
        validCustomDefs.forEach((d) => {
          const val = rawRow[d.name] !== undefined ? rawRow[d.name] : (rawRow[`po_${d.name}`] || null);
          (entity as any)[d.name] = val;
        });
        if (targetAnchor !== 'all' && targetAnchor !== 'all_gr' && targetAnchor !== 'all_custom') {
          const safeCol = targetAnchor.replace(/[^a-zA-Z0-9_]/g, '');
          if ((entity as any)[safeCol] === undefined) {
            (entity as any)[safeCol] = rawRow[safeCol] !== undefined ? rawRow[safeCol] : (rawRow[`po_${safeCol}`] || null);
          }
        }
      }
    });
    poRows = entities;

    if (!poRows || poRows.length === 0) {
      const anyRows = await this.poRepository.find({ where: { po_number: poNumber } });
      if (!anyRows || anyRows.length === 0) {
        throw new NotFoundException(`Purchase Order ${poNumber} tidak ditemukan.`);
      }
      throw new NotFoundException(
        `Purchase Order ${poNumber} ditemukan, namun belum memiliki data untuk anchor "${anchorDef.display_label}". Silakan pilih sumber anchor lain atau lengkapi data PO terlebih dahulu.`,
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

    // Determine milestone percentage and term position
    // Project standard: Strictly 2 Terms: Term 1 = 60% (GR 1) OR Term 2 = 40% (GR 2).
    // A single invoice document exclusively bills ONE term.
    let milestonePct = options?.milestone_pct;
    const termLabelOpt = (options?.term_label || '').toUpperCase();

    let currentTermPosition = 1;
    if (Number(milestonePct) === 40 || termLabelOpt.includes('TERM - 2') || termLabelOpt.includes('TERM 2')) {
      currentTermPosition = 2;
      milestonePct = 40;
    } else {
      currentTermPosition = 1;
      milestonePct = 60;
    }

    // Query existing invoices recorded for this PO from purchase_order_invoices
    const existingPoiQuery = this.invoiceRepository
      .createQueryBuilder('poi')
      .innerJoin(PurchaseOrder, 'po', 'po.id = poi.purchase_order_id::integer')
      .select('poi.id', 'id')
      .addSelect('poi.purchase_order_id', 'purchase_order_id')
      .addSelect('poi.invoice_number', 'invoice_number')
      .addSelect('poi.invoice_date', 'invoice_date')
      .addSelect('poi.position', 'position')
      .addSelect('poi.invoiced_grs', 'invoiced_grs')
      .where('po.po_number = :poNumber', { poNumber })
      .andWhere("poi.invoice_number IS NOT NULL AND TRIM(poi.invoice_number) != ''");

    validCustomDefs.forEach((d) => {
      existingPoiQuery.addSelect(`po."${d.name}"`, `po_${d.name}`);
    });

    const existingInvoices = await existingPoiQuery.getRawMany();

    const invoicedGrMap = new Map<string, {
      invoice_number: string;
      invoice_date: string;
      term_position: number;
    }>();

    for (const inv of existingInvoices) {
      const invNum = inv.invoice_number ? String(inv.invoice_number).trim() : '';
      if (!invNum) continue;
      const invDate = inv.invoice_date ? moment(inv.invoice_date).format('YYYY-MM-DD') : '';
      const pos = Number(inv.position) || 1;

      // 1. Check explicit invoiced_grs column
      if (inv.invoiced_grs) {
        const parts = String(inv.invoiced_grs).split(/[,|]/);
        for (const p of parts) {
          const g = p.trim();
          if (g) {
            invoicedGrMap.set(g, {
              invoice_number: invNum,
              invoice_date: invDate,
              term_position: pos,
            });
          }
        }
      }

      // 2. Check custom columns from linked PO row
      for (const d of validCustomDefs) {
        const rawVal = inv[`po_${d.name}`] || inv[d.name];
        if (rawVal) {
          const colPos = getGrTermPosition(d.name, d.label);
          if (colPos === pos || !inv.position) {
            const parts = String(rawVal).split(/[,|]/);
            for (const p of parts) {
              const g = p.trim();
              if (g && !invoicedGrMap.has(g)) {
                invoicedGrMap.set(g, {
                  invoice_number: invNum,
                  invoice_date: invDate,
                  term_position: colPos,
                });
              }
            }
          }
        }
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
    let totalAutoExcludedCount = 0;
    let totalActiveUnbilledCount = 0;
    let itemNo = 1;

    const effectiveAnchorTitle = currentTermPosition === 2 ? 'NO GR 2' : 'NO GR 1';

    for (const lineKey of sortedLineKeys) {
      const rows = lineMap.get(lineKey);
      const rep = rows[0];

      const unitPrice = Number(rep.unit_price) || 0;
      const totalQty = rows.reduce((acc, r) => acc + (Number(r.requested_qty) || 0), 0);

      // Collect distinct GR numbers with their requested_qty, target term, and invoicing status
      const grSet = new Set<string>();
      const grItems: Array<{
        po_id: number;
        gr_number: string;
        requested_qty: number;
        source_column: string;
        source_label: string;
        target_term: number;
        is_already_invoiced: boolean;
        invoiced_in: {
          invoice_number: string;
          invoice_date: string;
          term_position: number;
        } | null;
        is_other_term: boolean;
      }> = [];
      const grQtyMap: Record<string, number> = {};
      const defaultExcludedGrs: string[] = [];
      const activeUnbilledGrs: string[] = [];
      const alreadyInvoicedGrs: Array<{ gr_number: string; invoice_number: string; invoice_date: string }> = [];

      let rowGr1 = '-';
      let rowGr2 = '-';

      for (const r of rows) {
        const rowAnchors = extractAnchorsFromRow(r, targetAnchor, validCustomDefs);
        if (rowAnchors.length > 0) {
          const seenInRow = new Set<string>();
          const uniqueRowAnchors: typeof rowAnchors = [];
          for (const g of rowAnchors) {
            if (!seenInRow.has(g.gr_number)) {
              seenInRow.add(g.gr_number);
              uniqueRowAnchors.push(g);
            }
          }

          // Populate rowGr1 and rowGr2 for informational cross-term reference
          for (const g of uniqueRowAnchors) {
            const pos = getGrTermPosition(g.source_column, g.source_label);
            if (pos === 1 && rowGr1 === '-') rowGr1 = g.gr_number;
            if (pos === 2 && rowGr2 === '-') rowGr2 = g.gr_number;
          }

          const rowReqQty = Number(r.requested_qty) || 0;

          // Project Rule: A single invoice document exclusively bills ONE term.
          // Term 1 exclusively targets GR 1; Term 2 exclusively targets GR 2.
          const termAnchors = uniqueRowAnchors.filter(
            (g) => getGrTermPosition(g.source_column, g.source_label) === currentTermPosition
          );

          for (const g of termAnchors) {
            const targetTerm = currentTermPosition;
            const invoicedInfo = invoicedGrMap.get(g.gr_number) || null;
            const isAlreadyInvoiced = !!invoicedInfo;

            grSet.add(g.gr_number);
            // In milestone/term-based invoicing, each GR represents the full requested_qty of the line item
            const anchorQty = rowReqQty;

            grItems.push({
              po_id: r.id,
              gr_number: g.gr_number,
              requested_qty: anchorQty,
              source_column: g.source_column,
              source_label: g.source_label,
              target_term: targetTerm,
              is_already_invoiced: isAlreadyInvoiced,
              invoiced_in: invoicedInfo,
              is_other_term: false,
            });

            grQtyMap[g.gr_number] = (grQtyMap[g.gr_number] || 0) + anchorQty;

            if (isAlreadyInvoiced) {
              if (!defaultExcludedGrs.includes(g.gr_number)) {
                defaultExcludedGrs.push(g.gr_number);
              }
              if (!alreadyInvoicedGrs.some((x) => x.gr_number === g.gr_number)) {
                alreadyInvoicedGrs.push({
                  gr_number: g.gr_number,
                  invoice_number: invoicedInfo.invoice_number,
                  invoice_date: invoicedInfo.invoice_date,
                });
              }
              totalAutoExcludedCount++;
            } else {
              if (!activeUnbilledGrs.includes(g.gr_number)) {
                activeUnbilledGrs.push(g.gr_number);
                totalActiveUnbilledCount++;
              }
            }
          }
        }
      }
      const grString = Array.from(grSet).join('|');

      // Determine Anchor value for this line
      let anchorValue = grString || '-';
      if (anchorValue === '-' && targetAnchor !== 'all') {
        const safeCol = targetAnchor.replace(/[^a-zA-Z0-9_]/g, '');
        const distinctVals = Array.from(
          new Set(
            rows
              .map((r) => (r as any)[safeCol])
              .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
              .map((v) => {
                if (v instanceof Date) return moment(v).format('YYYY-MM-DD');
                return String(v).trim();
              }),
          ),
        );
        anchorValue = distinctVals.length > 0 ? distinctVals.join(' | ') : String((rep as any)[safeCol] || '-');
      }

      const unit = extractUnitFromDescription(rep.item_description, rep.unit);

      const itemPoNumber = String(rep.po_number || poNumber);
      const itemLinePoNumber = String(rep.line_po_number || lineKey);
      const poLineValue = `${itemPoNumber}-${itemLinePoNumber}`;

      // Calculate initial active qty: ONLY unbilled GRs for the current term!
      // If the line has active unbilled GRs for this term, initialActiveQty is totalQty (requested_qty).
      // If the line has no GR for this term or all GRs are already billed, initialActiveQty is 0.
      let initialActiveQty = totalQty;
      if (isGrBased) {
        if (grItems.length === 0 || activeUnbilledGrs.length === 0) {
          initialActiveQty = 0;
        } else {
          initialActiveQty = activeUnbilledGrs.reduce(
            (sum, g) => sum + (Number(grQtyMap[g]) || 0),
            0
          );
        }
      }

      const isFullyInvoiced = isGrBased && (grItems.length === 0 || activeUnbilledGrs.length === 0);
      const linePrice = initialActiveQty > 0 ? unitPrice * initialActiveQty : 0;
      const lineAmount = Math.round(linePrice * (milestonePct / 100));

      if (initialActiveQty > 0) {
        totalPrice += linePrice;
        totalRequestedQty += initialActiveQty;
      }

      const noGr1 = rowGr1;
      const noGr2 = rowGr2;

      items.push({
        no: itemNo++,
        po_id: rep.id,
        po_ids: rows.map((r) => r.id),
        po_number: itemPoNumber,
        line_po_number: itemLinePoNumber,
        po_line: poLineValue,
        description: rep.item_description || `Item Line ${itemLinePoNumber}`,
        no_gr: grString,
        no_gr_1: noGr1,
        no_gr_2: noGr2,
        gr_items: grItems,
        gr_qty_map: grQtyMap,
        default_excluded_grs: defaultExcludedGrs,
        active_unbilled_grs: activeUnbilledGrs,
        already_invoiced_grs: alreadyInvoicedGrs,
        is_fully_invoiced: isFullyInvoiced,
        anchor_title: effectiveAnchorTitle,
        anchor_label: anchorDef.display_label,
        anchor_value: anchorValue,
        is_gr_based: isGrBased,
        unit_price: unitPrice,
        requested_qty: totalQty,
        active_qty: initialActiveQty,
        qty: initialActiveQty,
        unit: unit,
        price: linePrice,
        milestone_pct: milestonePct,
        amount: lineAmount,
      });
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
        applied_anchor_column: targetAnchor,
        applied_gr_column: targetAnchor,
        anchor_title: effectiveAnchorTitle,
        anchor_label: anchorDef.display_label,
        is_gr_based: isGrBased,
        current_term_position: currentTermPosition,
        total_invoiced_gr_count: invoicedGrMap.size,
        auto_excluded_gr_count: totalAutoExcludedCount,
        active_unbilled_gr_count: totalActiveUnbilledCount,
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
        term_label:
          options?.term_label ||
          `PAYMENT TERM - ${currentTermPosition === 2 ? 2 : 1} (${milestonePct}%)`,
        payment_term_1_label:
          options?.term_label ||
          `PAYMENT TERM - ${currentTermPosition === 2 ? 2 : 1} (${milestonePct}%)`,
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
    revised_invoice_number?: string;
    invoice_date: string;
    payment_amount: number;
    unit_price?: number;
    user_id?: number;
    milestone_pct?: number;
    term_label?: string;
    position?: number;
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
      gr_items?: Array<{
        po_id?: number;
        gr_number: string;
        requested_qty?: number;
        source_column?: string;
        source_label?: string;
        target_term?: number;
      }>;
    }>;
    gr_column?: string;
    anchor_column?: string;
  }) {
    const cleanInvoiceNumber = payload.invoice_number ? payload.invoice_number.trim() : '';
    if (!cleanInvoiceNumber) {
      throw new BadRequestException('Nomor Invoice Resmi wajib diisi.');
    }

    // Determine if this is a revision of an existing invoice
    let revisedInvoiceNumber = (payload.revised_invoice_number || '').trim();
    if (!revisedInvoiceNumber) {
      const revMatch = cleanInvoiceNumber.match(/^(.+?)[-_\s]Rev\.?\s*(\d+)$/i);
      if (revMatch) {
        const base = revMatch[1].trim();
        const revIndex = parseInt(revMatch[2], 10);
        if (revIndex === 1) {
          revisedInvoiceNumber = base;
        } else if (revIndex > 1) {
          revisedInvoiceNumber = `${base}-Rev${revIndex - 1}`;
        }
      }
    }

    // STRICT CHECK: Reject if this official invoice number already exists in purchase_order_invoices
    // No invoice number can ever be sent twice, unless it's explicitly overwriting an existing record on the same PO
    const duplicateCheck = await this.checkInvoiceNumber(cleanInvoiceNumber, payload.po_number);
    const isOverwritingExisting =
      Boolean(revisedInvoiceNumber) &&
      duplicateCheck.exists &&
      duplicateCheck.details?.is_same_po &&
      cleanInvoiceNumber.toLowerCase() === revisedInvoiceNumber.toLowerCase();

    if (duplicateCheck.exists && !isOverwritingExisting) {
      const d = duplicateCheck.details;
      const formattedDate = d?.invoice_date ? moment(d.invoice_date).format('DD-MMM-YYYY') : '';
      const formattedAmount = d?.total_payment ? 'Rp. ' + Number(d.total_payment).toLocaleString('id-ID') : '';
      throw new ConflictException(
        `Nomor Invoice Resmi '${cleanInvoiceNumber}' SUDAH PERNAH DIGUNAKAN di sistem SIMPRO (tercatat pada PO: ${d?.po_number || '-'}, Tanggal: ${formattedDate || '-'}, Total: ${formattedAmount || '-'}). Nomor invoice resmi tidak boleh dikirim/disimpan dua kali.`
      );
    }

    const userId = payload.user_id ? Number(payload.user_id) : 1;
    const invDate = payload.invoice_date ? new Date(payload.invoice_date) : new Date();

    // Determine target payment term position (strictly 1 or 2)
    // Project standard: Term 1 = 60% (GR 1), Term 2 = 40% (GR 2)
    let targetPosition = payload.position;
    if (targetPosition !== 1 && targetPosition !== 2) {
      const termStr = (payload.term_label || '').toUpperCase();
      if (termStr.includes('TERM - 2') || termStr.includes('TERM 2') || Number(payload.milestone_pct) === 40) {
        targetPosition = 2;
      } else {
        targetPosition = 1;
      }
    }

    // 1. Fetch all rows of this PO from purchase_orders
    const poRows = await this.poRepository.find({
      where: { po_number: payload.po_number },
      order: { id: 'ASC' },
    });

    if (!poRows || poRows.length === 0) {
      throw new NotFoundException(`Purchase Order ${payload.po_number} tidak ditemukan.`);
    }

    // Approach #3: Look up existing records belonging to the invoice being revised on this PO
    let oldInvoiceRecords: PurchaseOrderInvoice[] = [];
    if (revisedInvoiceNumber) {
      oldInvoiceRecords = await this.invoiceRepository
        .createQueryBuilder('poi')
        .innerJoin('poi.po', 'po')
        .where('po.po_number = :poNumber', { poNumber: payload.po_number })
        .andWhere('LOWER(TRIM(poi.invoice_number)) = LOWER(TRIM(:revNum))', { revNum: revisedInvoiceNumber })
        .andWhere('poi.position = :pos', { pos: targetPosition })
        .getMany();
    }

    // Fallback: If deduced revisedInvoiceNumber was not found, check base number directly
    if (oldInvoiceRecords.length === 0) {
      const revMatch = cleanInvoiceNumber.match(/^(.+?)[-_\s]Rev\.?\s*(\d+)$/i);
      if (revMatch) {
        const base = revMatch[1].trim();
        const baseRecords = await this.invoiceRepository
          .createQueryBuilder('poi')
          .innerJoin('poi.po', 'po')
          .where('po.po_number = :poNumber', { poNumber: payload.po_number })
          .andWhere('LOWER(TRIM(poi.invoice_number)) = LOWER(TRIM(:baseNum))', { baseNum: base })
          .andWhere('poi.position = :pos', { pos: targetPosition })
          .getMany();

        if (baseRecords.length > 0) {
          oldInvoiceRecords = baseRecords;
          revisedInvoiceNumber = base;
        }
      }
    }

    const usedOldRecordIds = new Set<number>();

    // Map rows by line_po_number
    const rowsByLine = new Map<string, typeof poRows>();
    for (const r of poRows) {
      const lineKey = String(r.line_po_number || '1');
      if (!rowsByLine.has(lineKey)) rowsByLine.set(lineKey, []);
      rowsByLine.get(lineKey).push(r);
    }

    // Dynamic custom columns from PO management
    let customCols: POCustomColumn[] = [];
    try {
      customCols = await this.poCustomColumnRepo.find();
    } catch (e) {
      customCols = [];
    }
    const previewExistingCols = await this.getDbColumnNames();
    const validCustomDefs = customCols
      .filter((c) => c.column_name && previewExistingCols.has(c.column_name.toLowerCase()))
      .map((c) => ({
        name: c.column_name,
        label: c.display_label || c.column_name,
      }));

    let savedRecordsCount = 0;
    const recordsProcessed = [];

    if (payload.lines && payload.lines.length > 0) {
      // Process active lines from Invoice Generator
      for (const line of payload.lines) {
        const lineUnitPrice = line.unit_price !== undefined ? Number(line.unit_price) : 0;
        const lineAmount =
          line.amount !== undefined
            ? Number(line.amount)
            : Math.round(lineUnitPrice * Number(line.qty || 1));

        // 1. Identify all underlying purchase_orders rows for this line
        const linePoRows = rowsByLine.get(String(line.line_po_number)) || [];
        const candidateRows =
          linePoRows.length > 0
            ? linePoRows
            : line.po_ids && line.po_ids.length > 0
            ? poRows.filter((r) => line.po_ids.includes(r.id))
            : line.po_id
            ? poRows.filter((r) => r.id === line.po_id)
            : [poRows[0]];

        // 2. Determine which candidate rows are active and their respective GRs for targetPosition
        const activeRows: Array<{
          row: typeof poRows[0];
          grs: string[];
          qty: number;
        }> = [];

        const hasActiveGrsPayload = Array.isArray(line.active_grs) && line.active_grs.length > 0;

        for (const r of candidateRows) {
          // Extract GRs for this row and target position
          const grsFromItems = (line.gr_items || [])
            .filter((gi) => gi.po_id === r.id)
            .map((gi) => String(gi.gr_number).trim());

          const grsFromRow = extractGrsFromRow(r, 'all', validCustomDefs)
            .filter((g) => getGrTermPosition(g.source_column, g.source_label) === targetPosition)
            .map((g) => String(g.gr_number).trim());

          const rowTermGrs = Array.from(new Set([...grsFromItems, ...grsFromRow])).filter(Boolean);

          if (hasActiveGrsPayload) {
            const matchedActiveGrs = rowTermGrs.filter((gr) => line.active_grs.includes(gr));
            if (rowTermGrs.length > 0) {
              if (matchedActiveGrs.length > 0) {
                activeRows.push({
                  row: r,
                  grs: matchedActiveGrs,
                  qty: Number(r.requested_qty) || 0,
                });
              }
              // Else: row has GRs for this term, but none are in active_grs -> excluded by user
            } else {
              // Row has no GRs for this term: check if any other candidate row in this line has GRs
              const anyCandidateHasGrs = candidateRows.some((cr) => {
                const cGrs = extractGrsFromRow(cr, 'all', validCustomDefs).filter(
                  (g) => getGrTermPosition(g.source_column, g.source_label) === targetPosition
                );
                return cGrs.length > 0;
              });
              if (!anyCandidateHasGrs) {
                // Line does not use GRs at all (e.g. non-GR item): row is active
                activeRows.push({
                  row: r,
                  grs: [],
                  qty: Number(r.requested_qty) || 0,
                });
              }
            }
          } else if (Number(line.qty || 0) > 0) {
            activeRows.push({
              row: r,
              grs: rowTermGrs,
              qty: Number(r.requested_qty) || 0,
            });
          }
        }

        // Safety check: ensure every active GR in line.active_grs is covered
        if (hasActiveGrsPayload) {
          for (const gr of line.active_grs) {
            const alreadyCovered = activeRows.some((a) => a.grs.includes(gr));
            if (!alreadyCovered) {
              const matchingPoRow = poRows.find((r) => {
                const grs = extractGrsFromRow(r, 'all', validCustomDefs).map((g) => g.gr_number);
                return grs.includes(gr);
              });
              if (matchingPoRow) {
                const existingActive = activeRows.find((a) => a.row.id === matchingPoRow.id);
                if (existingActive) {
                  if (!existingActive.grs.includes(gr)) existingActive.grs.push(gr);
                } else {
                  activeRows.push({
                    row: matchingPoRow,
                    grs: [gr],
                    qty: Number(matchingPoRow.requested_qty) || 0,
                  });
                }
              } else if (activeRows.length > 0) {
                if (!activeRows[0].grs.includes(gr)) activeRows[0].grs.push(gr);
              } else if (candidateRows.length > 0) {
                activeRows.push({
                  row: candidateRows[0],
                  grs: [gr],
                  qty: Number(candidateRows[0].requested_qty) || 0,
                });
              }
            }
          }
        }

        // Fallback if activeRows is empty but line has positive qty
        if (activeRows.length === 0 && Number(line.qty || 0) > 0 && candidateRows.length > 0) {
          activeRows.push({
            row: candidateRows[0],
            grs: [],
            qty: Number(candidateRows[0].requested_qty) || Number(line.qty) || 0,
          });
        }

        if (activeRows.length === 0) {
          continue;
        }

        // Proportional payment amount calculation across all active rows of this line
        const totalActiveQty = activeRows.reduce(
          (sum, a) => sum + (a.qty > 0 ? a.qty : 1),
          0
        );

        let remainingLineAmount = lineAmount;

        for (let i = 0; i < activeRows.length; i++) {
          const entry = activeRows[i];
          const targetPoId = entry.row.id;
          const posGrs = entry.grs;
          const invoicedGrsString = posGrs.length > 0 ? posGrs.join(', ') : null;
          const rowQty = entry.qty > 0 ? entry.qty : 1;

          let posAmount: number;
          if (i === activeRows.length - 1) {
            posAmount = remainingLineAmount;
          } else if (totalActiveQty > 0) {
            posAmount = Math.round(lineAmount * (rowQty / totalActiveQty));
            remainingLineAmount -= posAmount;
          } else {
            posAmount = Math.round(lineAmount / activeRows.length);
            remainingLineAmount -= posAmount;
          }

          // 1. Try to reuse/overwrite an old invoice record for this PO line (Approach #3)
          let targetPoi: PurchaseOrderInvoice | null = null;
          const oldForTarget = oldInvoiceRecords.find(
            (r) =>
              !usedOldRecordIds.has(r.id) &&
              String(r.purchase_order_id) === String(targetPoId) &&
              Number(r.position) === targetPosition
          );
          if (oldForTarget) {
            targetPoi = oldForTarget;
            usedOldRecordIds.add(targetPoi.id);
          }

          // 2. If not from old invoice, check if an unbilled slot already exists for targetPoId & targetPosition
          if (!targetPoi) {
            const existingPoi = await this.invoiceRepository.findOne({
              where: {
                purchase_order_id: String(targetPoId),
                position: targetPosition,
              },
            });

            if (
              existingPoi &&
              (!existingPoi.invoice_number ||
                existingPoi.invoice_number.trim() === '' ||
                existingPoi.invoice_number.trim() === cleanInvoiceNumber)
            ) {
              targetPoi = existingPoi;
            }
          }

          // 3. Overwrite existing record or insert new record
          if (targetPoi) {
            targetPoi.invoice_number = cleanInvoiceNumber;
            targetPoi.invoice_date = invDate;
            targetPoi.invoice_status = 'Generated';
            targetPoi.payment_amount = posAmount;
            targetPoi.submit_amount = posAmount;
            targetPoi.unit_price = lineUnitPrice;
            targetPoi.user_id = userId;
            targetPoi.submit_date = invDate;
            targetPoi.position = targetPosition;
            targetPoi.invoiced_grs = invoicedGrsString || targetPoi.invoiced_grs;
            await this.invoiceRepository.save(targetPoi);
            savedRecordsCount++;
            recordsProcessed.push(targetPoi);
          } else {
            const newEntity = this.invoiceRepository.create({
              purchase_order_id: String(targetPoId),
              position: targetPosition,
              invoice_number: cleanInvoiceNumber,
              invoice_date: invDate,
              invoice_status: 'Generated',
              payment_amount: posAmount,
              submit_amount: posAmount,
              unit_price: lineUnitPrice,
              user_id: userId,
              submit_date: invDate,
              invoiced_grs: invoicedGrsString,
            });
            await this.invoiceRepository.save(newEntity);
            savedRecordsCount++;
            recordsProcessed.push(newEntity);
          }
        }
      }

      // Approach #3: Release any records from the old invoice that were NOT included in this revision (e.g. excluded GRs/lines)
      for (const oldRec of oldInvoiceRecords) {
        if (!usedOldRecordIds.has(oldRec.id) && Number(oldRec.position) === targetPosition) {
          const duplicateSlot = await this.invoiceRepository.findOne({
            where: {
              purchase_order_id: oldRec.purchase_order_id,
              position: oldRec.position,
              invoice_number: '',
            },
          });
          if (duplicateSlot && duplicateSlot.id !== oldRec.id) {
            await this.invoiceRepository.remove(oldRec);
          } else {
            oldRec.invoice_number = '';
            oldRec.invoice_date = null;
            oldRec.invoice_status = null;
            oldRec.payment_amount = null;
            oldRec.submit_amount = 0;
            oldRec.invoiced_grs = null;
            await this.invoiceRepository.save(oldRec);
          }
        }
      }
    } else {
      // Fallback: auto-create records for lines of this PO that have GR
      const targetGrCol = payload.gr_column || 'all';
      const hasAnyGr = poRows.some((r) => extractGrsFromRow(r, targetGrCol, validCustomDefs).length > 0);
      const eligibleRows = hasAnyGr
        ? poRows.filter((r) => extractGrsFromRow(r, targetGrCol, validCustomDefs).length > 0)
        : poRows;

      const fallbackLineMap = new Map<string, typeof poRows>();
      for (const r of eligibleRows) {
        const lineKey = String(r.line_po_number || '1');
        if (!fallbackLineMap.has(lineKey)) fallbackLineMap.set(lineKey, []);
        fallbackLineMap.get(lineKey).push(r);
      }

      const msPct = payload.milestone_pct || (targetPosition === 2 ? 40 : 60);
      for (const [lineKey, rows] of fallbackLineMap.entries()) {
        const lineQty = rows.reduce((acc, r) => acc + (Number(r.requested_qty) || 0), 0) || 1;
        const rep = rows[0];
        const unitPrice = Number(rep.unit_price) || 0;
        const linePrice = unitPrice * lineQty;
        const lineAmount = Math.round(linePrice * (msPct / 100));

        let remainingFallbackAmount = lineAmount;

        for (let i = 0; i < rows.length; i++) {
          const rowItem = rows[i];
          const targetPoId = rowItem.id;
          const rowQty = Number(rowItem.requested_qty) || 1;
          const posAmount =
            i === rows.length - 1
              ? remainingFallbackAmount
              : Math.round(lineAmount * (rowQty / lineQty));
          remainingFallbackAmount -= posAmount;

          const lineGrs = extractGrsFromRow(rowItem, targetGrCol, validCustomDefs)
            .filter((g) => getGrTermPosition(g.source_column, g.source_label) === targetPosition)
            .map((g) => g.gr_number);
          const invoicedGrsString = lineGrs.length > 0 ? lineGrs.join(', ') : null;

          let targetPoi: PurchaseOrderInvoice | null = null;
          const oldForTarget = oldInvoiceRecords.find(
            (r) =>
              !usedOldRecordIds.has(r.id) &&
              String(r.purchase_order_id) === String(targetPoId) &&
              Number(r.position) === targetPosition
          );
          if (oldForTarget) {
            targetPoi = oldForTarget;
            usedOldRecordIds.add(targetPoi.id);
          }

          if (!targetPoi) {
            const existingPoi = await this.invoiceRepository.findOne({
              where: {
                purchase_order_id: String(targetPoId),
                position: targetPosition,
              },
            });

            if (
              existingPoi &&
              (!existingPoi.invoice_number ||
                existingPoi.invoice_number.trim() === '' ||
                existingPoi.invoice_number.trim() === cleanInvoiceNumber)
            ) {
              targetPoi = existingPoi;
            }
          }

          if (targetPoi) {
            targetPoi.invoice_number = cleanInvoiceNumber;
            targetPoi.invoice_date = invDate;
            targetPoi.invoice_status = 'Generated';
            targetPoi.payment_amount = posAmount;
            targetPoi.submit_amount = posAmount;
            targetPoi.unit_price = unitPrice;
            targetPoi.user_id = userId;
            targetPoi.submit_date = invDate;
            targetPoi.position = targetPosition;
            targetPoi.invoiced_grs = invoicedGrsString || targetPoi.invoiced_grs;
            await this.invoiceRepository.save(targetPoi);
            savedRecordsCount++;
            recordsProcessed.push(targetPoi);
          } else {
            const newEntity = this.invoiceRepository.create({
              purchase_order_id: String(targetPoId),
              position: targetPosition,
              invoice_number: cleanInvoiceNumber,
              invoice_date: invDate,
              invoice_status: 'Generated',
              payment_amount: posAmount,
              submit_amount: posAmount,
              unit_price: unitPrice,
              user_id: userId,
              submit_date: invDate,
              invoiced_grs: invoicedGrsString,
            });
            await this.invoiceRepository.save(newEntity);
            savedRecordsCount++;
            recordsProcessed.push(newEntity);
          }
        }
      }

      // Cleanup unused old records in fallback branch
      for (const oldRec of oldInvoiceRecords) {
        if (!usedOldRecordIds.has(oldRec.id) && Number(oldRec.position) === targetPosition) {
          const duplicateSlot = await this.invoiceRepository.findOne({
            where: {
              purchase_order_id: oldRec.purchase_order_id,
              position: oldRec.position,
              invoice_number: '',
            },
          });
          if (duplicateSlot && duplicateSlot.id !== oldRec.id) {
            await this.invoiceRepository.remove(oldRec);
          } else {
            oldRec.invoice_number = '';
            oldRec.invoice_date = null;
            oldRec.invoice_status = null;
            oldRec.payment_amount = null;
            oldRec.submit_amount = 0;
            oldRec.invoiced_grs = null;
            await this.invoiceRepository.save(oldRec);
          }
        }
      }
    }

    return {
      message: `Invoice ${payload.invoice_number} berhasil disimpan dengan ${savedRecordsCount} record PO (Term ${targetPosition})${revisedInvoiceNumber ? ` [Revisi dari ${revisedInvoiceNumber}]` : ''}`,
      invoice_number: payload.invoice_number,
      revised_invoice_number: revisedInvoiceNumber || null,
      term_position: targetPosition,
      total_lines_saved: savedRecordsCount,
      records: recordsProcessed,
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
      .addSelect('MAX(poi.position)', 'position')
      .addSelect("STRING_AGG(DISTINCT NULLIF(TRIM(poi.invoiced_grs), ''), ', ')", 'invoiced_grs')
      .where("poi.invoice_number IS NOT NULL AND TRIM(poi.invoice_number) != ''");

    if (poNumber) {
      qb.andWhere('po.po_number = :poNumber', { poNumber });
    }

    qb.groupBy('poi.invoice_number')
      .orderBy('MAX(poi.created_at)', 'DESC')
      .take(100);

    const rawList = await qb.getRawMany();

    return rawList.map((r) => ({
      id: r.id,
      invoice_number: r.invoice_number,
      invoice_date: r.invoice_date,
      invoice_status: r.invoice_status || 'Generated',
      payment_amount: Number(r.payment_amount) || 0,
      line_count: Number(r.line_count) || 1,
      position: r.position ? Number(r.position) : 1,
      invoiced_grs: r.invoiced_grs || '',
      po_number: r.po_number,
      customer_name: r.customer_name,
      project_name: r.project_name,
      po: {
        po_number: r.po_number,
        customer: { name: r.customer_name },
        project: { name: r.project_name },
      },
    }));
  }
}
