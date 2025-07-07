import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateCustomerDTO {
  @ApiProperty({ example: 'Huawei' })
  @IsNotEmpty({ message: 'Nama Customer tidak boleh kosong' })
  @Validate(IsNotExist, ['Customer'], {
    message: 'Customer telah terdaftar',
  })
  name: string;
}
