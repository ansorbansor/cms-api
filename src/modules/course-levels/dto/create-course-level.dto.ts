import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateCourseLevelDto {
  @ApiProperty({ example: 'Level A' })
  @Validate(IsNotExist, ['CourseLevel', 'name'], {
    message: 'Nama level sudah ada',
  })
  @IsNotEmpty()
  name: string | null;
}
