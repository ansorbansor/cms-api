import { Transform, Type } from 'class-transformer';
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
import { FileEntity } from 'src/entities/file.entity';
import { CreateUserTopicDto } from './create-user-topic.dto';

export class CreateUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'NIP tidak boleh kosong' })
  @Validate(IsNotExist, ['User'], {
    message: 'NIP telah terdaftar',
  })
  nip: string | null;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @Validate(IsNotExist, ['User'], {
    message: 'Email telah digunakan',
  })
  @IsEmail({}, { message: 'Format email salah' })
  email: string | null;

  @ApiProperty({ example: 'Password9' })
  @MinLength(6)
  password?: string;

  @ApiProperty({ default: 'email' })
  @IsNotEmpty({ message: 'Provider tidak boleh kosong' })
  provider?: string;

  @IsOptional()
  @ApiProperty({ type: 'string', format: 'binary' })
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photoFile?: FileEntity | null;

  @ApiProperty({ default: 1 })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
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

  hash?: string;

  @ApiProperty()
  @ValidateNested({
    each: true,
  })
  @IsOptional()
  @IsArray()
  @Type(() => CreateUserTopicDto)
  categories: CreateUserTopicDto[];

  @ApiProperty()
  @IsOptional()
  level: number;
}
