import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, Validate } from 'class-validator';
import { FileEntity } from 'src/entities/file.entity';
import { IsExist } from 'src/utils/validators';

export class AuthUpdateDto {
  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photoFile?: FileEntity | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsOptional()
  @IsEmail({}, { message: 'Format email salah' })
  email: string | null;
}
