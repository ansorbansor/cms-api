import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateCourseRatingDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Rating A' })
  @Validate(IsNotExist, ['CourseRating', 'name', 'id'], {
    message: 'Nama rating sudah ada',
  })
  @IsNotEmpty()
  name: string | null;
}
