import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class ReviewAbsenceDTO {
  @ApiProperty({
    example: 'APPROVE',
    enum: ['APPROVE', 'REJECT'],
  })
  @IsNotEmpty({ message: 'Aksi review wajib diisi (APPROVE atau REJECT)' })
  @IsIn(['APPROVE', 'REJECT'], {
    message: 'Aksi review harus bernilai APPROVE atau REJECT',
  })
  action: 'APPROVE' | 'REJECT';

  @ApiProperty({
    example: 'Foto surat dokter buram atau tidak berstempel klinik',
    required: false,
  })
  @IsOptional()
  rejection_reason?: string;
}
