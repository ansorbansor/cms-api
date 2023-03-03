import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';
import { FileEntity } from 'src/entities/file.entity';
import { Transform } from 'class-transformer';

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
  status?: boolean;

  @ApiProperty()
  @IsOptional()
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
