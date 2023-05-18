import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class CreatePurchaseOrderDTO {
  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'CC tidak boleh kosong' })
  @Validate(IsNotExist, ['PurchaseOrder'], {
    message: 'CC telah terdaftar',
  })
  cc: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Line PO Status tidak boleh kosong' })
  line_po_status: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  line_po_number: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'PO Number tidak boleh kosong' })
  po_number: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  shipment_number: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Region ID tidak boleh kosong' })
  @Validate(IsExist, ['Region', 'id'], {
    message: 'Region tidak ditemukan',
  })
  region_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Area', 'id'], {
    message: 'Area tidak ditemukan',
  })
  area_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Operator ID tidak boleh kosong' })
  @Validate(IsExist, ['Operator', 'id'], {
    message: 'Operator tidak ditemukan',
  })
  operator_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Customer', 'id'], {
    message: 'Customer tidak ditemukan',
  })
  customer_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Project', 'id'], {
    message: 'Project tidak terdaftar',
  })
  project_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Site', 'id'], {
    message: 'Site tidak terdaftar',
  })
  site_id: number;

  @ApiProperty({ example: 'NEW' })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  status: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  item_code: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Item Description tidak boleh kosong' })
  item_description: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Unit Price tidak boleh kosong' })
  unit_price: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Unite Price 1 tidak boleh kosong' })
  unit_price_1: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Unit Price 2 tidak boleh kosong' })
  unit_price_2: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Requested Qty tidak boleh kosong' })
  requested_qty: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Billed Qty tidak boleh kosong' })
  billed_qty: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Due Qty tidak boleh kosong' })
  due_qty: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Line Amount tidak boleh kosong' })
  line_amount: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Remaining From PO tidak boleh kosong' })
  remaining_from_po: number;

  @ApiProperty({ example: 'LOT' })
  @IsOptional()
  unit: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  payment_terms: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['BiddingArea', 'id'], {
    message: 'Bidding Area tidak terdaftar',
  })
  bidding_area_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  publish_date: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Start Date tidak boleh kosong' })
  start_date: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  end_date: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  priority_esar_approve: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  remark_weekly: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['RemarkProject', 'id'], {
    message: 'Remark Project tidak terdaftar',
  })
  remark_project_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['StatusAcceptance', 'id'], {
    message: 'Status Acceptance tidak terdaftar',
  })
  status_acceptance_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['PendingType', 'id'], {
    message: 'Pending Type tidak terdaftar',
  })
  pending_type_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  pending_approval_pd: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Amount Pending Approval PD tidak boleh kosong' })
  amount_pending_approval_pd: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['PD', 'id'], {
    message: 'PD tidak terdaftar',
  })
  pd_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  actual_completion_date: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  ready_invoice: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Amount Ready Invoice tidak boleh kosong' })
  amount_ready_invoice: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  remark_highlight: string;

  @ApiProperty({ example: 70 })
  @IsNotEmpty({ message: 'Budget Percentage tidak boleh kosong' })
  budget_percentage: number;

  @ValidateNested({ each: true })
  @Type(() => Invoices)
  invoices: Invoices[];
}

class Invoices {
  @ApiProperty({ example: 'ABC123' })
  @IsOptional()
  invoice_number: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  invoice_date: Date;

  @ApiProperty({ example: 'ABC123' })
  @IsOptional()
  invoice_status: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  payment_date: Date;

  @ApiProperty({ example: 'ABC123' })
  @IsOptional()
  supplier_tax_number: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  supplier_tax_date: Date;

  @ApiProperty({ example: '123' })
  @IsOptional()
  payment_amount: number;

  @ApiProperty({ example: '123' })
  @IsOptional()
  deduction_amount: number;

  @ApiProperty({ example: '123' })
  @IsOptional()
  unit_price: number;
}
