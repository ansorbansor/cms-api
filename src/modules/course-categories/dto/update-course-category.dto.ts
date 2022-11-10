import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Validate,
} from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class UpdateCourseCategoryDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID kategori tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Category A' })
  @Validate(IsNotExist, ['CourseCategory', 'name', 'id'], {
    message: 'Nama kategori sudah ada',
  })
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  name: string | null;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumberString(null, { message: 'Kirimkan ID PKASN Program' })
  @Validate(IsExist, ['PKASNProgram', 'id'], {
    message: 'PKASN Program tidak tersedia.',
  })
  pkasn_program: number;

  @ApiProperty({ type: 'string', format: 'binary' })
  photo: any;

  @ApiProperty({ example: 'Topic A' })
  @IsOptional()
  topic: string[];
}
