import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class AuthEmailLoginDto {
  @ApiProperty({ example: '123123123123123' })
  @IsNotEmpty()
  nip: string;

  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty()
  password: string;

  @IsOptional()
  expiration: number;
}
