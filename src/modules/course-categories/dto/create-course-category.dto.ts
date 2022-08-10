import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateCourseCategoryDto {
  @ApiProperty({ example: 'Category A' })
  @Validate(IsNotExist, ['CourseCategory', 'name'], {
    message: 'Nama kategori sudah ada',
  })
  @IsNotEmpty()
  name: string | null;

  @ApiProperty({ type: 'string', format: 'binary' })
  photo: any;
}
