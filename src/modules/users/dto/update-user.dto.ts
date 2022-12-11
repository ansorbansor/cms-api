import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';
import { FileEntity } from 'src/entities/file.entity';
import { Transform } from 'class-transformer';
import { Role } from 'src/entities/role.entity';

export class UpdateUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsOptional()
  nik?: string | null;

  @ApiProperty({ example: 'John' })
  @IsOptional()
  name?: string | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsOptional()
  @IsEmail({}, { message: 'Format email salah' })
  email?: string | null;

  @ApiProperty({ example: 'Password9' })
  @IsOptional()
  password?: string;

  @ApiProperty({ default: 'email' })
  @IsOptional()
  provider?: string;

  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photoFile?: FileEntity | null;

  @IsOptional()
  photo?: number;

  @ApiProperty({ default: true })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? 1 : 0))
  status?: number;

  @ApiProperty({
    required: false,
  })
  notification_token?: string | null;

  @ApiProperty()
  @IsOptional()
  @Validate(IsExist, ['Role', 'id'], {
    message: 'Role Tidak Tersedia',
  })
  role?: Role | null;

  @ApiProperty()
  @IsOptional()
  @Validate(IsExist, ['EmployeePosition', 'id'], {
    message: 'Jabatan Tidak Tersedia',
  })
  employee_position_id?: number;

  hash?: string | null;
}
