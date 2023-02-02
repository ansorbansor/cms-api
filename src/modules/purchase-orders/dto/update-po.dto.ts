import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdatePurchaseOrderDTO {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID PO tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: '1234567890' })
  @IsOptional()
  @Validate(IsNotExist, ['PurchaseOrder', 'cc'], {
    message: 'CC telah terdaftar',
  })
  cc: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  line_po_status: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  line_po_number: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  po_number: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  shipment_number: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  region_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  area_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  operator_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  customer_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  project_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  site_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  status: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  item_code: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  item_description: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  unit_price: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  unit_price_1: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  unit_price_2: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  requested_qty: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  billed_qty: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  due_qty: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  line_amount: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  remaining_from_po: number;

  @ApiProperty({ example: 'LOT' })
  @IsOptional()
  unit: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  payment_terms: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  bidding_area_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  publish_date?: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  start_date?: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  end_date?: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  priority_esar_approve: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  remark_weekly: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  remark_project_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  status_acceptance_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  pending_type_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  pending_approval_pd: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  amount_pending_approval_pd: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  pd_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  actual_completion_date?: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  ready_invoice: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  amount_ready_invoice: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  remark_highlight: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  budget_percentage: number;
}
