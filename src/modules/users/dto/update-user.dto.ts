import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';
import { FileEntity } from 'src/entities/file.entity';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  nik?: string | null;

  @ApiProperty({ example: 'John' })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  name?: string | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : null))
  @IsOptional()
  @IsEmail({}, { message: 'Format email salah' })
  email?: string | null;

  @ApiProperty({ example: 'Password9' })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  password?: string;

  @ApiProperty({ default: 'email' })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
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
  @Transform(({ value }) => (value === 'true' ? true : false))
  status?: boolean;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  phone: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  notification_token?: string | null;

  @ApiProperty()
  @IsOptional()
  @Validate(IsExist, ['EmployeePosition', 'id'], {
    message: 'Jabatan Tidak Tersedia',
  })
  @IsOptional()
  employee_position_id?: number;

  hash?: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  region: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  gm_region: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  company: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  category: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  team_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  uniportal_account: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  project: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  pass_id_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  cyber_security_status: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  level_iresource: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  wah_certification_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  electrical_certification_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  firstaid_certification_number: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  status_description: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  wah_validation_end_date: Date | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  electrical_validation_end_date: Date | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  firstaid_validation_end_date: Date | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  bank: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value == '' ? null : value))
  bank_account_number: string | null;
}
