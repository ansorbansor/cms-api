import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';
import { FileEntity } from 'src/entities/file.entity';
import { Role } from 'src/entities/role.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  name: string | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  @Validate(IsNotExist, ['User'], {
    message: 'Email telah digunakan',
  })
  @IsEmail({}, { message: 'Format email salah' })
  email: string | null;

  @ApiProperty()
  @MinLength(6)
  password?: string;

  provider?: string;

  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photo?: FileEntity | null;

  @ApiProperty({ default: true })
  @IsNotEmpty()
  status: boolean | true;

  @ApiProperty()
  @IsOptional()
  notification_token: string | null;

  @ApiProperty()
  role: Role;
}
