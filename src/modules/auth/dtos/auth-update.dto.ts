import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class AuthUpdateDto {
  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsOptional()
  @IsEmail({}, { message: 'Format email salah' })
  @Validate(IsNotExist, ['User'], {
    message: 'Email telah terdaftar',
  })
  email: string | null;
}
