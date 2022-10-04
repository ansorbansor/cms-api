import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';
import { Transform, Type } from 'class-transformer';
import { FileEntity } from 'src/entities/file.entity';
import { CreateUserTopicDto } from 'src/modules/users/dto/create-user-topic.dto';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty()
  nip: string | null;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  name: string | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  @Validate(IsNotExist, ['User'], {
    message: 'Email telah digunakan',
  })
  @IsEmail()
  email: string | null;

  @ApiProperty({ example: 'Password9' })
  @MinLength(6)
  password?: string;

  @ApiProperty({ default: 'email' })
  @IsNotEmpty()
  provider?: string;

  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photo?: FileEntity | null;

  @ApiProperty({ default: true })
  @IsNotEmpty()
  @Transform(({ value }) => (value === 'true' ? 1 : 0))
  status: number;

  @ApiProperty({
    required: false,
  })
  notification_token: string | null;

  @ApiProperty()
  @Validate(IsExist, ['Role', 'id'], {
    message: 'Role Tidak Tersedia',
  })
  role_id: number;

  @ApiProperty()
  @Validate(IsExist, ['EmployeeUnit', 'id'], {
    message: 'Satuan Kerja Tidak Tersedia',
  })
  unit_id: number;

  @ApiProperty()
  @Validate(IsExist, ['EmployeeLevel', 'id'], {
    message: 'Pangkat Tidak Tersedia',
  })
  level_id: number;

  @ApiProperty()
  @Validate(IsExist, ['EmployeePosition', 'id'], {
    message: 'Jabatan Tidak Tersedia',
  })
  position_id: number;

  hash?: string | null;

  @ApiProperty()
  @ValidateNested({
    each: true,
  })
  @IsArray()
  @Type(() => CreateUserTopicDto)
  categories: CreateUserTopicDto[];

  @ApiProperty()
  level: number;
}
