import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class CreateSPKOperationalDTO {
  @ApiProperty({ example: 'Test' })
  status?: number;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'Region tidak boleh kosong' })
  @Validate(IsExist, ['Region', 'id'], {
    message: 'Region tidak ditemukan',
  })
  @Transform(({ value }) => (value == '' || value == 'null' || value == null ? null : value))
  region_id?: number;

  @ApiProperty({ example: 'Test' })
  @IsOptional()
  @Transform(({ value }) =>
    value == '' || value == 'null' || value == null ? 0 : value,
  )
  spk_operational_request_type_id?: number;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'spk_operational_category_id tidak boleh kosong' })
  @Validate(IsExist, ['SPKOperationalCategory', 'id'], {
    message: 'spk_operational_category_id tidak ditemukan',
  })
  @Transform(({ value }) => (value == '' || value == null ? 0 : value))
  spk_operational_category_id?: number;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'spk_operational_subcategory_id tidak boleh kosong' })
  @Validate(IsExist, ['SPKOperationalSubCategory', 'id'], {
    message: 'spk_operational_subcategory_id tidak ditemukan',
  })
  @Transform(({ value }) => (value == '' || value == null ? 0 : value))
  spk_operational_subcategory_id?: number;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'Cash advance tidak boleh kosong' })
  cash_advance?: number;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'pay_to_user_id tidak boleh kosong' })
  @Validate(IsExist, ['User', 'id'], {
    message: 'pay_to_user_id tidak ditemukan',
  })
  @Transform(({ value }) => (value == '' || value == 'null' || value == null ? null : value))
  pay_to_user_id?: number;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'Name tidak boleh kosong' })
  name?: string;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'Area tidak boleh kosong' })
  @Validate(IsExist, ['Area', 'id'], {
    message: 'Area tidak ditemukan',
  })
  @Transform(({ value }) => (value == '' || value == 'null' || value == null ? null : value))
  area_id?: number;

  @ApiProperty({ example: 'Test' })
  @IsNotEmpty({ message: 'Description tidak boleh kosong' })
  description?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Inhouse team tidak boleh kosong' })
  @IsArray({ message: 'Inhouse team harus array' })
  inhouse_team_user_id: number[];

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsOptional()
  remark_inhouse_team: string;

  @ApiProperty({ example: 'Test' })
  cashout?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Customer', 'id'], {
    message: 'Customer tidak ditemukan',
  })
  @Transform(({ value }) => (value == '' || value == 'null' || value == null ? null : value))
  customer_id: number;

  @ApiProperty({ example: 'Test' })
  created_by?: number;

  is_over_budget: boolean;
}
