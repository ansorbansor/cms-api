import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdatePendingTypeDTO {
  @ApiProperty({ example: 'Installation' })
  @IsNotEmpty({ message: 'PendingType tidak boleh kosong' })
  @Validate(IsNotExist, ['PendingType'], {
    message: 'PendingType telah terdaftar',
  })
  name: string;
}
