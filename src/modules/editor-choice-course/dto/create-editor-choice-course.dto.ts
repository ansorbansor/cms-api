import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';
1;
export class CreateEditorChoiceCourseDto {
  @ApiProperty({ example: 1 })
  @Validate(IsExist, ['Course', 'id'], {
    message: 'Course tidak tersedia',
  })
  @IsNotEmpty({ message: 'ID pelatihan tidak boleh kosong' })
  course_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Posisi tidak boleh kosong' })
  position: number;
}
