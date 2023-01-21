import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class UpdateSPKDTO {
  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Regions'], {
    message: 'Region tidak ditemukan',
  })
  region_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Transportations'], {
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
  @Validate(IsExist, ['Users'], {
    message: 'Pengguna tidak ditemukan',
  })
  pay_to_user_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Sites'], {
    message: 'Site tidak ditemukan',
  })
  site_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Areas'], {
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
  @Validate(IsExist, ['purchase_orders'], {
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
}
