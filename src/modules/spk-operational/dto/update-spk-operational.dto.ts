import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class UpdateSPKOperationalDTO {
  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Region', 'id'], {
    message: 'Region tidak ditemukan',
  })
  region_id: number;

  @ApiProperty({ example: 'Test' })
  @IsOptional()
  @Transform(({ value }) =>
    value == '' || value == 'null' || value == null ? 0 : value,
  )
  spk_operational_request_type_id?: number;

  @ApiProperty({ example: 'Test' })
  @IsOptional()
  @Validate(IsExist, ['SPKOperationalCategory', 'id'], {
    message: 'spk_operational_category_id tidak ditemukan',
  })
  spk_operational_category_id?: number;

  @ApiProperty({ example: 200000 })
  @IsOptional()
  cash_advance: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['User', 'id'], {
    message: 'Pengguna tidak ditemukan',
  })
  pay_to_user_id: number;

  @ApiProperty({ example: 'Test' })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Area', 'id'], {
    message: 'Area tidak ditemukan',
  })
  area_id: number;

  @ApiProperty({ example: 'Test' })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsArray({ message: 'Inhouse team harus array' })
  inhouse_team_user_id: number[];

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsOptional()
  remark_inhouse_team: string;

  @ApiProperty({ example: '-' })
  @IsOptional()
  remark_superadmin: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Customer', 'id'], {
    message: 'Customer tidak ditemukan',
  })
  customer_id: number;

  status: number;
  is_over_budget: boolean;
}
