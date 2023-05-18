import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class UpdateSPKDTO {
  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Region', 'id'], {
    message: 'Region tidak ditemukan',
  })
  region_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Transportation', 'id'], {
    message: 'Armada tidak ditemukan',
  })
  transportation_id: number;

  @ApiProperty({ example: 'D 123 XXX' })
  @IsOptional()
  police_number: string;

  @ApiProperty({ example: 200000 })
  @IsOptional()
  cash_advance: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['User', 'id'], {
    message: 'Pengguna tidak ditemukan',
  })
  pay_to_user_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Site', 'id'], {
    message: 'Site tidak ditemukan',
  })
  site_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Area', 'id'], {
    message: 'Area tidak ditemukan',
  })
  area_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  distance: number;

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsOptional()
  work_type: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['PurchaseOrder', 'id'], {
    message: 'PO tidak ditemukan',
  })
  po_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsArray({ message: 'Inhouse team harus array' })
  inhouse_team_user_id: number[];

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsOptional()
  remark_inhouse_team: string;

  @ApiProperty({ example: 10 })
  @IsOptional()
  total_range: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['SPKCategory', 'id'], {
    message: 'Kategori SPK tidak ditemukan',
  })
  category_id: number;

  distance_to_site_photo: number;
  km_range_start_photo: number;
  km_range_end_photo: number;
  status: number;
}
