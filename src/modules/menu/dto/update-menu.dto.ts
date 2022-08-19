import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateMenuDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Menu A' })
  @Validate(IsNotExist, ['Menu', 'name'], {
    message: 'Nama menu sudah ada',
  })
  @IsNotEmpty()
  name: string;
}
