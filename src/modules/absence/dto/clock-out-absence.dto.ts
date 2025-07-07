import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class ClockOutAbsenceDTO {
  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_out_latitude tidak boleh kosong' })
  clock_out_latitude: number;

  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_out_longitude tidak boleh kosong' })
  clock_out_longitude: number;

  @ApiProperty({ example: 'Menyelesaikan laporan harian', required: false }) // Added required: false
  @IsOptional()
  activity_result: string;

  clock_out: Date;

  @ApiProperty({ example: 123, required: false }) // Added ApiProperty
  @IsOptional() // Marked optional
  clock_out_photo: number;
}
