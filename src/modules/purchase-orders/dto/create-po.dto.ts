import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
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
  @IsNotEmpty({ message: 'Line PO Number tidak boleh kosong' })
  line_po_number: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'PO Number tidak boleh kosong' })
  po_number: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Shipment Number tidak boleh kosong' })
  shipment_number: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Region ID tidak boleh kosong' })
  @Validate(IsExist, ['Region', 'id'], {
    message: 'Region tidak ditemukan',
  })
  region_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Area ID tidak boleh kosong' })
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
  @IsNotEmpty({ message: 'Customer ID tidak boleh kosong' })
  @Validate(IsExist, ['Customer', 'id'], {
    message: 'Customer tidak ditemukan',
  })
  customer_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Project Name tidak boleh kosong' })
  project_name: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Project Code tidak boleh kosong' })
  project_code: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Site ID tidak boleh kosong' })
  site_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  status: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Item Code tidak boleh kosong' })
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
  @IsNotEmpty({ message: 'Unit tidak boleh kosong' })
  unit: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Payment Term tidak boleh kosong' })
  payment_term: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Bidding Area ID tidak boleh kosong' })
  bidding_area_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Publish Date tidak boleh kosong' })
  publish_date: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Start Date tidak boleh kosong' })
  start_date: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'End Date tidak boleh kosong' })
  end_date: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Priority Esar Approve tidak boleh kosong' })
  priority_esar_approve: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Remark Weekly tidak boleh kosong' })
  remark_weekly: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Remark Project ID tidak boleh kosong' })
  remark_project_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Status Acceptance ID tidak boleh kosong' })
  status_acceptance_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Pending Type ID tidak boleh kosong' })
  pending_type_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Pending Approval PD tidak boleh kosong' })
  pending_approval_pd: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Amount Pending Approval PD tidak boleh kosong' })
  amount_pending_approval_pd: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'PD ID tidak boleh kosong' })
  pd_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Actual Completion Date tidak boleh kosong' })
  actual_completion_date: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Ready Invoice tidak boleh kosong' })
  ready_invoice: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Amount Ready Invoice tidak boleh kosong' })
  amount_ready_invoice: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Remark Highlight tidak boleh kosong' })
  remark_highlight: string;
}
