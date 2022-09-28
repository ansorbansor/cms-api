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
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Coupon A' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CODE#123' })
  @Validate(IsNotExist, ['Coupon', 'code'], {
    message: 'Kode kupon sudah ada',
  })
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 1 })
  @Validate(IsExist, ['Provider', 'id'], {
    message: 'Penyelenggara tidak ditemukan',
  })
  @IsNotEmpty()
  provider_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
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
  @IsNotEmpty()
  status: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  end_date: Date;
}
