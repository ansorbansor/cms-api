import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';
import { IsNotExist } from 'src/utils/validators';
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
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  email: string | null;

  @ApiProperty({ example: 'Password9' })
  @MinLength(6)
  password?: string;

  provider?: string;

  @IsOptional()
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  photo?: FileEntity | null;

  @ApiProperty({ default: true })
  @IsNotEmpty()
  status: boolean | true;

  @ApiProperty({
    required: false,
  })
  notification_token: string | null;

  @ApiProperty()
  role: Role;

  hash?: string | null;
}
