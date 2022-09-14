import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class CreateUserTopicDto {
  @ApiProperty({ example: 1, type: Number })
  @IsNotEmpty()
  @Validate(IsExist, ['CourseCategory', 'id'], {
    message: 'Kategori tidak tersedia',
  })
  category_id: number;

  @ApiProperty({ example: [2, 3, 4], type: Number })
  @IsNotEmpty()
  @Validate(IsExist, ['Topic', 'id'], {
    message: 'Topic tidak tersedia',
  })
  topic_id: number[];
}
