import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthConfirmEmailDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Hash code tidak boleh kosong' })
  hash: string;
}
