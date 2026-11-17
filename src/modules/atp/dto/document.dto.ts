import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAtpDocumentDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  template_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  project_id?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @ApiProperty({ example: 'SUM-SS-PLG-8272/SUM-SS-PLG-0541' })
  @IsOptional()
  @IsString()
  link_id?: string;

  @ApiProperty({ example: 'SF_Megaria_COLLECTOR / Duku Palembang' })
  @IsOptional()
  @IsString()
  link_name?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  site_id_ne?: number;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsNumber()
  site_id_fe?: number;

  @ApiProperty({ example: '2026-09-17' })
  @IsOptional()
  @IsString()
  atp_date?: string;
}

export class SaveAtpValuesDto {
  @ApiProperty({
    example: [
      { template_item_id: 1, text_value: 'PLG-01', test_result: 'Pass', photo_url: '...', remarks: '' }
    ]
  })
  @IsNotEmpty()
  values: Array<{
    template_item_id: number;
    text_value?: string;
    test_result?: string;
    photo_id?: number;
    photo_url?: string;
    take_data_submission_id?: number;
    remarks?: string;
  }>;

  @ApiProperty({ example: 'PASS' })
  @IsOptional()
  @IsString()
  acceptance_status?: string;

  @ApiProperty({ example: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class SubmitAtpReviewDto {
  @ApiProperty({ example: 'MS RTS' })
  @IsNotEmpty()
  @IsString()
  reviewer_role: string;

  @ApiProperty({ example: 'Komara Sandi' })
  @IsNotEmpty()
  @IsString()
  pic_name: string;

  @ApiProperty({ example: 'APPROVED' })
  @IsNotEmpty()
  @IsString()
  status: string; // 'APPROVED' | 'PUNCHLIST' | 'REVISE'

  @ApiProperty({ example: 'data:image/png;base64,...' })
  @IsOptional()
  @IsString()
  signature_url?: string;

  @ApiProperty({ example: 'Catatan punchlist' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
