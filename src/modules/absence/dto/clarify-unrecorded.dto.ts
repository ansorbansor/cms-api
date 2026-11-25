import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class ClarifyUnrecordedDTO {
  @ApiProperty({
    example: '2026-11-20',
    description: 'Tanggal hari kerja yang kosong/terlewat (format YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'Tanggal hari kerja yang diklarifikasi wajib diisi' })
  absence_date: string;

  @ApiProperty({
    example: 'CUTI_TAHUNAN',
    enum: ['CUTI_TAHUNAN', 'SAKIT', 'CUTI_KHUSUS'],
    description: 'Klarifikasi HANYA boleh memilih salah satu dari 3 opsi ini',
  })
  @IsNotEmpty({ message: 'Pilihan klarifikasi wajib diisi' })
  @IsIn(['CUTI_TAHUNAN', 'SAKIT', 'CUTI_KHUSUS'], {
    message:
      'Pilihan klarifikasi hari kosong HANYA diperbolehkan: CUTI_TAHUNAN, SAKIT, atau CUTI_KHUSUS',
  })
  absence_type: string;

  @ApiProperty({ example: 'Menikah', required: false })
  @IsOptional()
  special_leave_type?: string;

  @ApiProperty({ example: 'Surat dokter terlampir', required: false })
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  defer_evidence?: boolean;
}
