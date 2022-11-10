import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateCourseDurationDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID durasi tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: '1-5 JP' })
  @Validate(IsNotExist, ['CourseDuration', 'name'], {
    message: 'Nama durasi sudah ada',
  })
  @IsNotEmpty({ message: 'Nama durasi tidak boleh kosong' })
  name: string | null;

  @ApiProperty({ example: 40 })
  @IsOptional()
  minimum: number | null;

  @ApiProperty({ example: 200 })
  @IsOptional()
  maximum: number | null;
}
