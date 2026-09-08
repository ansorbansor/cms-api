import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreatePerjalananDinasDTO {
  @ApiProperty({ example: 'Project A' })
  @IsOptional()
  @IsString()
  project_name?: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsNotEmpty({ message: 'Kota Tujuan tidak boleh kosong' })
  @IsString()
  destination_city: string;

  @ApiProperty({ example: '2026-09-07T00:00:00Z' })
  @IsNotEmpty({ message: 'Tanggal Keberangkatan tidak boleh kosong' })
  start_date: string;

  @ApiProperty({ example: '2026-09-10T00:00:00Z' })
  @IsNotEmpty({ message: 'Tanggal Kembali tidak boleh kosong' })
  end_date: string;

  @ApiProperty({ example: 'Meeting dengan client' })
  @IsNotEmpty({ message: 'Tujuan/Agenda tidak boleh kosong' })
  @IsString()
  purpose: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  attachment_id?: number;
}
