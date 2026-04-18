import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateTransportationDto {
  @ApiProperty({ example: 'Truck' })
  @IsNotEmpty({ message: 'Nama armada tidak boleh kosong' })
  name: string;
}
