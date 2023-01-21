import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, Validate, ValidateNested } from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class UpdateRoleDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID role tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Role A' })
  @Validate(IsNotExist, ['Role', 'name'], {
    message: 'Nama role sudah ada',
  })
  @IsNotEmpty({ message: 'Nama role tidak boleh kosong' })
  name: string;

  @ApiProperty()
  @ValidateNested({
    each: true,
  })
  @IsArray()
  @Type(() => Menu)
  menu: Menu[];
}

class Menu {
  @ApiProperty({ example: 1 })
  @Validate(IsExist, ['Menu', 'id'], {
    message: 'Menu tidak tersedia',
  })
  @IsNotEmpty({ message: 'ID menu tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: [0, 1, 2, 3] })
  @IsNotEmpty({ message: 'Akses tidak boleh kosong' })
  access: number[];
}
