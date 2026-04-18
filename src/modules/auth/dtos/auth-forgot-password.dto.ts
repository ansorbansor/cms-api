import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'john.tor1@gmail.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : null))
  @IsEmail({}, { message: 'Format email salah' })
  email: string;
}
