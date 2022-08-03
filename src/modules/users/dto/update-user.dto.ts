import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, MinLength, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';
import { FileEntity } from 'src/entities/file.entity';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsOptional()
  nip?: string | null;

  @ApiProperty({ example: 'John' })
  @IsOptional()
  name?: string | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ example: 'Password9' })
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ default: 'email' })
  @IsOptional()
  provider?: string;

  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photo?: FileEntity | null;

  @ApiProperty({ default: true })
  @IsOptional()
  status?: boolean | true;

  @ApiProperty({
    required: false,
  })
  notification_token?: string | null;

  @ApiProperty()
  @IsOptional()
  @Validate(IsExist, ['Role', 'id'], {
    message: 'Role Tidak Tersedia',
  })
  role_id?: number;

  @ApiProperty()
  @IsOptional()
  @Validate(IsExist, ['EmployeeUnit', 'id'], {
    message: 'Satuan Kerja Tidak Tersedia',
  })
  unit_id?: number;

  @ApiProperty()
  @IsOptional()
  @Validate(IsExist, ['EmployeeLevel', 'id'], {
    message: 'Pangkat Tidak Tersedia',
  })
  level_id?: number;

  @ApiProperty()
  @IsOptional()
  @Validate(IsExist, ['EmployeePosition', 'id'], {
    message: 'Jabatan Tidak Tersedia',
  })
  position_id?: number;

  hash?: string | null;
}
