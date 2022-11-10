import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateCourseLanguageDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID bahasa tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Language A' })
  @Validate(IsNotExist, ['CourseLanguage', 'name', 'id'], {
    message: 'Nama bahasa sudah ada',
  })
  @IsNotEmpty({ message: 'Nama bahasa tidak boleh kosong' })
  name: string | null;
}
