import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MinLength, Validate } from 'class-validator';
import { FileEntity } from 'src/entities/file.entity';
import { IsExist } from 'src/utils/validators';

export class AuthUpdateDto {
  @ApiProperty({ example: 'Password9' })
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Password9' })
  @IsOptional()
  oldPassword: string;

  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photoFile?: FileEntity | null;
}
