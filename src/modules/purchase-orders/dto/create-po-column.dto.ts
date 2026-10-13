import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CreatePOColumnDTO {
  @ApiProperty({ example: 'Vendor Tracking' })
  @IsNotEmpty()
  @IsString()
  display_label: string;

  @ApiProperty({ example: 'varchar', enum: ['varchar', 'text', 'numeric', 'date', 'boolean'] })
  @IsNotEmpty()
  @IsIn(['varchar', 'text', 'numeric', 'date', 'boolean'])
  data_type: string;

  @ApiProperty({ example: 'col_vendor_tracking', required: false })
  @IsOptional()
  @IsString()
  column_name?: string;

  @ApiProperty({ example: 150, required: false })
  @IsOptional()
  width?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  is_required?: boolean;
}
