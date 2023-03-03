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

export class CreateUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'NIK tidak boleh kosong' })
  @Validate(IsNotExist, ['User'], {
    message: 'NIK telah terdaftar',
  })
  nik: string | null;

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
  @Transform(({ value }) => (value === 'true' ? true : false))
  status: boolean;

  @ApiProperty()
  @IsNotEmpty({ message: 'Nomor handphone tidak boleh kosong' })
  phone: string;

  @ApiProperty({
    required: false,
  })
  notification_token: string | null;

  @ApiProperty()
  @Validate(IsExist, ['EmployeePosition', 'id'], {
    message: 'Jabatan Tidak Tersedia',
  })
  employee_position_id: number;

  hash?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  region: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  gm_region: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  company: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  category: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  team_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  uniportal_account: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  project: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  pass_id_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  cyber_security_status: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  level_iresource: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  wah_certification_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  electrical_certification_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  firstaid_certification_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  status_description: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  wah_validation_end_date: Date | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  electrical_validation_end_date: Date | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  firstaid_validation_end_date: Date | null;
}
