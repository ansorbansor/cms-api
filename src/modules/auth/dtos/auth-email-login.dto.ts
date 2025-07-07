import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'bayu@example.com' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;
}
