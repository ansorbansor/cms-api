import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateCourseLanguageDto {
  @ApiProperty({ example: 'Language A' })
  @Validate(IsNotExist, ['CourseLanguage', 'name'], {
    message: 'Nama bahasa sudah ada',
  })
  @IsNotEmpty({ message: 'Nama bahasa tidak boleh kosong' })
  name: string | null;
}
