import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdatePDDTO {
  @ApiProperty({ example: 'Masagus Arief Rachmat 00363825' })
  @IsNotEmpty({ message: 'Nama PD tidak boleh kosong' })
  @Validate(IsNotExist, ['PD'], {
    message: 'PD telah terdaftar',
  })
  name: string;
}
