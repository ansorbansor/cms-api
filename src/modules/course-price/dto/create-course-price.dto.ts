import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateCoursePriceDto {
  @ApiProperty({ example: 'Price A' })
  @Validate(IsNotExist, ['CoursePrice', 'name'], {
    message: 'Nama harga sudah ada',
  })
  @IsNotEmpty({ message: 'Nama harga tidak boleh kosong' })
  name: string | null;
}
