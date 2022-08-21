import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, Validate, ValidateNested } from 'class-validator';
import { MenuPermission } from 'src/utils/enums';
import { IsArrayValid, IsExist, IsNotExist } from 'src/utils/validators';

export class CreateRoleDto {
  @ApiProperty({ example: 'Role A' })
  @Validate(IsNotExist, ['Role', 'name'], {
    message: 'Nama role sudah ada',
  })
  @IsNotEmpty()
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
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: [0, 1, 2, 3] })
  @IsNotEmpty()
  @Validate(
    IsArrayValid,
    [
      MenuPermission.CREATE,
      MenuPermission.READ,
      MenuPermission.UPDATE,
      MenuPermission.DELETE,
    ],
    { message: 'Akses menu tidak sesuai' },
  )
  access: number[];
}
