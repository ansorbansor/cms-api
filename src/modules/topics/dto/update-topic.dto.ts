import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class UpdateTopicDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Topic A' })
  @Validate(IsNotExist, ['Topic', 'name'], {
    message: 'Nama topic sudah ada',
  })
  @IsNotEmpty()
  name: string | null;

  @ApiProperty()
  @Validate(IsExist, ['CourseCategory', 'id'], {
    message: 'Kategori tidak tersedia',
  })
  category_id: number;
}
