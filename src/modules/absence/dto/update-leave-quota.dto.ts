import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLeaveQuotaDTO {
  @ApiProperty({ example: 12, description: 'Total kuota cuti tahunan' })
  @IsNotEmpty({ message: 'Total kuota cuti wajib diisi' })
  @IsNumber({}, { message: 'Total kuota harus berupa angka' })
  @Min(0, { message: 'Total kuota minimal 0' })
  total_quota: number;

  @ApiProperty({
    example: 'Penyesuaian kuota cuti oleh HR untuk masa kerja > 2 tahun',
    required: false,
  })
  @IsOptional()
  adjustment_notes?: string;
}
