import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'john.tor@example.com' })
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty()
  password: string;

  @IsOptional()
  expiration: number;
}
