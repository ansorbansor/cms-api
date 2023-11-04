import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ClockOutAbsenceDTO {
  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_out_latitude tidak boleh kosong' })
  clock_out_latitude: number;

  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_out_longitude tidak boleh kosong' })
  clock_out_longitude: number;

  clock_out: Date;
  clock_out_photo: number;
}
