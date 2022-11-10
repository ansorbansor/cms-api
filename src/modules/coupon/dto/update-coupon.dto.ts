import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Validate,
} from 'class-validator';
import { CouponType, CouponStatus } from 'src/utils/enums';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class UpdateCouponDto {
  @ApiProperty()
  @Validate(IsExist, ['Coupon', 'id'], {
    message: 'Kupon tidak ditemukan',
  })
  @IsNotEmpty({ message: 'ID kupon tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Coupon A' })
  @IsNotEmpty({ message: 'Nama kupon tidak boleh kosong' })
  name: string;

  @ApiProperty({ example: 'CODE#123' })
  @Validate(IsNotExist, ['Coupon', 'code'], {
    message: 'Kode kupon sudah ada',
  })
  @IsNotEmpty({ message: 'Kode kupon tidak boleh kosong' })
  code: string;

  @ApiProperty({ example: 1 })
  @Validate(IsExist, ['Provider', 'id'], {
    message: 'Penyelenggara tidak ditemukan',
  })
  @IsNotEmpty({ message: 'Penyelenggara tidak boleh kosong' })
  provider_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty({ message: 'Amount tidak boleh kosong' })
  amount: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Tipe kupon tidak boleh kosong' })
  @IsEnum(CouponType, {
    message: 'Tipe kupon tidak sesuai',
  })
  type: number;

  @ApiProperty({ example: 1 })
  @Validate(IsExist, ['Course', 'id'], {
    message: 'Pelatihan tidak ditemukan',
  })
  @IsOptional()
  course_id?: number;

  @ApiProperty({ example: 1, default: 2 })
  @IsEnum(CouponStatus, {
    message: 'Status kupon tidak sesuai',
  })
  @IsNotEmpty({ message: 'Status kupon tidak boleh kosong' })
  status: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Tanggal mulai tidak boleh kosong' })
  start_date: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Tanggal berakhir tidak boleh kosong' })
  end_date: Date;
}
