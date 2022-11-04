import { ApiProperty } from '@nestjs/swagger';
import { isEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'john.tor@example.com' })
  @IsNotEmpty()
  @Transform(({ value }) =>
    isEmail(value)
      ? value.toLowerCase().trim()
      : `${value.toLowerCase.trim()}@setneg.go.id`,
  )
  email: string;

  @ApiProperty({ example: 'Password9' })
  @IsNotEmpty()
  password: string;

  @IsOptional()
  expiration: number;
}
