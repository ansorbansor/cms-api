import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateProjectDTO {
  @ApiProperty({ example: 'Indonesia XL Seahawks Project' })
  @IsNotEmpty({ message: 'Nama Project tidak boleh kosong' })
  @Validate(IsNotExist, ['Project'], {
    message: 'Project Name telah terdaftar',
  })
  name: string;

  @ApiProperty({ example: '56A03F6' })
  @IsNotEmpty({ message: 'Nama Project tidak boleh kosong' })
  @Validate(IsNotExist, ['Project'], {
    message: 'Project Code telah terdaftar',
  })
  code: string;
}
