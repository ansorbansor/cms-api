import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class CreateSPKDTO {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Region tidak boleh kosong' })
  @Validate(IsExist, ['Region', 'id'], {
    message: 'Region tidak ditemukan',
  })
  region_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Armada tidak boleh kosong' })
  @Validate(IsExist, ['Transportation', 'id'], {
    message: 'Armada tidak ditemukan',
  })
  transportation_id: number;

  @ApiProperty({ example: 'D 123 XXX' })
  @IsNotEmpty({ message: 'Nomor polisi tidak boleh kosong' })
  police_number: string;

  @ApiProperty({ example: 200000 })
  @IsNotEmpty({ message: 'Cash advance tidak boleh kosong' })
  cash_advance: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Pay to tidak boleh kosong' })
  @Validate(IsExist, ['User', 'id'], {
    message: 'Pengguna tidak ditemukan',
  })
  pay_to_user_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Site tidak boleh kosong' })
  @Validate(IsExist, ['Site', 'id'], {
    message: 'Site tidak ditemukan',
  })
  site_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Area tidak boleh kosong' })
  @Validate(IsExist, ['Area', 'id'], {
    message: 'Area tidak ditemukan',
  })
  area_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Jarak tidak boleh kosong' })
  distance: number;

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsNotEmpty({ message: 'Work type tidak boleh kosong' })
  work_type: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'PO tidak boleh kosong' })
  @Validate(IsExist, ['PurchaseOrder', 'id'], {
    message: 'PO tidak ditemukan',
  })
  po_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Inhouse team tidak boleh kosong' })
  @IsArray({ message: 'Inhouse team harus array' })
  inhouse_team_user_id: number[];

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsOptional()
  remark_inhouse_team: string;

  @ApiProperty({ example: 10 })
  @IsOptional()
  total_range: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Kategori tidak boleh kosong' })
  @Validate(IsExist, ['SPKCategory', 'id'], {
    message: 'Kategori SPK tidak ditemukan',
  })
  category_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Customer', 'id'], {
    message: 'Customer tidak ditemukan',
  })
  customer_id: number;

  @ApiProperty({ example: '-' })
  @IsOptional()
  remark_superadmin: string;

  distance_to_site_photo: number;
  km_range_start_photo: number;
  km_range_end_photo: number;
  km_back_to_office_photo: number;
  status: number;
  created_by: number;
  approved_by: number;
  is_over_budget: boolean;
}
