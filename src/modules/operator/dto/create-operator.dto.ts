import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateOperatorDTO {
  @ApiProperty({ example: 'Telkomsel' })
  @IsNotEmpty({ message: 'Nama Operator tidak boleh kosong' })
  @Validate(IsNotExist, ['Operator'], {
    message: 'Operator telah terdaftar',
  })
  name: string;
}
