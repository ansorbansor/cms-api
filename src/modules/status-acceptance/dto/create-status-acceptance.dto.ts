import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateStatusAcceptanceDTO {
  @ApiProperty({ example: 'Pending Acceptance by Subcon' })
  @IsNotEmpty({ message: 'Nama Status Acceptance tidak boleh kosong' })
  @Validate(IsNotExist, ['StatusAcceptance'], {
    message: 'Status Acceptance telah terdaftar',
  })
  name: string;
}
