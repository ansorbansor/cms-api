import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class TwoFactorAuthDto {
  @ApiProperty({ example: '123123123123123' })
  @IsNotEmpty({ message: 'NIP tidak boleh kosong' })
  nip: string;

  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;
}
