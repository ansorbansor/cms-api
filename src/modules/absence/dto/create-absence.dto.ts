import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAbsenceDTO {
  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_in_latitude tidak boleh kosong' })
  clock_in_latitude: number;

  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_in_longitude tidak boleh kosong' }) // Fixed message
  clock_in_longitude: number;

  @ApiProperty({ example: 'Terlambat karena macet', required: false })
  @IsOptional()
  late_reason: string;

  @ApiProperty({ example: 'Meeting dengan klien', required: false }) // Added ApiProperty
  @IsOptional()
  activity_plan: string;

  @ApiProperty({ required: false })
  @IsOptional()
  clock_in_kecamatan: string;

  @ApiProperty({ example: 123, required: false }) // Added ApiProperty
  @IsOptional()
  clock_in_photo: number;

  @ApiProperty({ example: 1 }) // Added ApiProperty
  user_id: number;

  @ApiProperty({ example: '2024-10-12T08:00:00Z' }) // Added ApiProperty
  clock_in: Date;
}
