import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class RequestLeaveDTO {
  @ApiProperty({
    example: 'CUTI_TAHUNAN',
    enum: ['CUTI_TAHUNAN', 'SAKIT', 'CUTI_KHUSUS', 'IZIN_POTONG_GAJI'],
  })
  @IsNotEmpty({ message: 'Tipe pengajuan izin/cuti wajib diisi' })
  @IsIn(['CUTI_TAHUNAN', 'SAKIT', 'CUTI_KHUSUS', 'IZIN_POTONG_GAJI'], {
    message: 'Tipe pengajuan harus salah satu dari: CUTI_TAHUNAN, SAKIT, CUTI_KHUSUS, IZIN_POTONG_GAJI',
  })
  absence_type: string;

  @ApiProperty({ example: '2026-11-24', required: false })
  @IsOptional()
  absence_date?: string;

  @ApiProperty({ example: 'Menikah', required: false })
  @IsOptional()
  special_leave_type?: string;

  @ApiProperty({ example: 'Pengajuan cuti tahunan acara keluarga', required: false })
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  defer_evidence?: boolean;
}
