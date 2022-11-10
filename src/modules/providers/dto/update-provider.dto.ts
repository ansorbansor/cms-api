import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateProviderDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID penyelenggara tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Mooc A' })
  @Validate(IsNotExist, ['Provider', 'name', 'id'], {
    message: 'Nama penyelenggara sudah ada',
  })
  @IsNotEmpty({ message: 'Nama penyelenggara tidak boleh kosong' })
  name: string | null;

  @ApiProperty({ type: 'string', format: 'binary' })
  photo: any;

  @ApiProperty({ example: 'https://www.udemy.com' })
  @IsNotEmpty({ message: 'URL penyelenggara tidak boleh kosong' })
  url: string;
}
