import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class AuthUpdatePasswordDto {
  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 digit' })
  password?: string;

  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty({ message: 'Password lama tidak boleh kosong' })
  oldPassword: string;
}
