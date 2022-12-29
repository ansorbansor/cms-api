import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreatePendingTypeDTO {
  @ApiProperty({ example: 'Installation' })
  @IsNotEmpty({ message: 'Pending Type tidak boleh kosong' })
  @Validate(IsNotExist, ['PendingType'], {
    message: 'Pending Type telah terdaftar',
  })
  name: string;
}
