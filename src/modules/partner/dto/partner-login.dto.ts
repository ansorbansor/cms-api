import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class PartnerLoginDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Client ID tidak boleh kosong' })
  client_id: number;

  @ApiProperty({ example: 'abcd123xxx' })
  @IsNotEmpty({ message: 'Client secret tidak boleh kosong' })
  client_secret: string;
}
