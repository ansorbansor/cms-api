import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateMenuDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID menu tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Menu A' })
  @Validate(IsNotExist, ['Menu', 'name'], {
    message: 'Nama menu sudah ada',
  })
  @IsNotEmpty({ message: 'Nama menu tidak boleh kosong' })
  name: string;
}
