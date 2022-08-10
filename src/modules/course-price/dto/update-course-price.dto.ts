import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateCoursePriceDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Price A' })
  @Validate(IsNotExist, ['CoursePrice', 'name', 'id'], {
    message: 'Nama harga sudah ada',
  })
  @IsNotEmpty()
  name: string | null;
}
