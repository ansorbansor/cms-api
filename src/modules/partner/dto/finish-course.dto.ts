import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  Validate,
} from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class FinishCourseDto {
  @ApiProperty({ example: 1 })
  @Validate(IsExist, ['Course', 'id'], {
    message: 'Pelatihan tidak ditemukan',
  })
  @IsNotEmpty({ message: 'ID Pelatihan tidak boleh kosong.' })
  course_id: number;

  @ApiProperty({ example: '1234567890123' })
  @IsNotEmpty({ message: 'NIP tidak boleh kosong' })
  nip: string;

  @ApiProperty({ example: '2022-11-04' })
  @IsNotEmpty({ message: 'Tanggal selesai tidak boleh kosong' })
  @IsDateString({ message: 'Format tanggal salah' })
  certificate_date: Date;

  @ApiProperty({ example: 'UDEMY-123321123321123' })
  @IsNotEmpty({ message: 'Nomor sertifikat tidak boleh kosong' })
  certificate_number: string;

  @ApiProperty({
    example: 'https://playbook.setneg.go.id/certificate/files12341234.png',
  })
  @IsOptional()
  certificate_image: string;
}
