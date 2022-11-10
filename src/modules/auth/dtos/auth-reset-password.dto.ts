import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthResetPasswordDto {
  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Hash code tidak boleh kosong' })
  hash: string;
}
