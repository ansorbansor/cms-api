import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class UpdateTopicDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID topik tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Topic A' })
  @Validate(IsNotExist, ['Topic', 'name'], {
    message: 'Nama topic sudah ada',
  })
  @IsNotEmpty({ message: 'Nama topik tidak boleh kosong' })
  name: string | null;

  @ApiProperty()
  @Validate(IsExist, ['CourseCategory', 'id'], {
    message: 'Kategori tidak tersedia',
  })
  category_id: number;
}
