import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateMaterialDTO {
  @ApiProperty()
  @IsString()
  material_name: string;

  @ApiProperty()
  @IsString()
  material_category: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  serial_number?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty()
  @IsString()
  source_type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  owner_client?: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  warehouse_region?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  site_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  project_name?: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  delivery_reference?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMaterialTransactionDTO {
  @ApiProperty()
  @IsString()
  transaction_type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  site_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiver_name?: string;
}
