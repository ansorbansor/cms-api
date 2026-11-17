import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateAtpTemplateDto {
  @ApiProperty({ example: 'PT. XLSMART Microwave Acceptance Test (Template v4.1)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Deskripsi template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  project_id?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @ApiProperty({ example: 'dual_end' })
  @IsOptional()
  @IsString()
  structure_type?: string;

  @ApiProperty({ example: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateAtpSectionDto {
  @ApiProperty({ example: '1. Site Information' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'site_info' })
  @IsNotEmpty()
  @IsString()
  section_key: string;

  @ApiProperty({ example: 'info_table' })
  @IsNotEmpty()
  @IsString()
  section_type: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  order_index?: number;

  @ApiProperty({ example: 'Deskripsi section' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateAtpItemDto {
  @ApiProperty({ example: '2.1.1.1' })
  @IsOptional()
  @IsString()
  item_no?: string;

  @ApiProperty({ example: 'A1' })
  @IsOptional()
  @IsString()
  picture_no?: string;

  @ApiProperty({ example: 'Site to be clean and tidy inside cabinet' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: 'checklist_pass_fail' })
  @IsOptional()
  @IsString()
  item_type?: string;

  @ApiProperty({ example: 'Minor' })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiProperty({ example: ['Option 1', 'Option 2'] })
  @IsOptional()
  options?: any;

  @ApiProperty({ example: 'Site Cleaning' })
  @IsOptional()
  @IsString()
  take_data_tag?: string;

  @ApiProperty({ example: 57 })
  @IsOptional()
  @IsNumber()
  take_data_template_item_id?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  order_index?: number;
}
