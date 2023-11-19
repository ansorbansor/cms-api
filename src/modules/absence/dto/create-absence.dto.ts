import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAbsenceDTO {
  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_in_latitude tidak boleh kosong' })
  clock_in_latitude: number;

  @ApiProperty({ example: 8.01233413 })
  @IsNotEmpty({ message: 'clock_in_longitude tidak boleh kosong' })
  clock_in_longitude: number;

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsOptional()
  late_reason: string;

  clock_in_photo: number;
  user_id: number;
  clock_in: Date;
}
