import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateMenuDto {
  @ApiProperty({ example: 'Menu A' })
  @Validate(IsNotExist, ['Menu', 'name'], {
    message: 'Nama menu sudah ada',
  })
  @IsNotEmpty({ message: 'Nama menu tidak boleh kosong' })
  name: string;
}
