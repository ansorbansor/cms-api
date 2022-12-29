import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateStatusAcceptanceDTO {
  @ApiProperty({ example: 'Huawei' })
  @IsNotEmpty({ message: 'Nama Status Acceptance tidak boleh kosong' })
  @Validate(IsNotExist, ['StatusAcceptance'], {
    message: 'Status Acceptance telah terdaftar',
  })
  name: string;
}
