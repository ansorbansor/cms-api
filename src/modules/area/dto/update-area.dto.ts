import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateAreaDTO {
  @ApiProperty({ example: 'Bandung' })
  @IsNotEmpty({ message: 'Nama area tidak boleh kosong' })
  @Validate(IsNotExist, ['Area'], {
    message: 'Area telah terdaftar',
  })
  name: string;
}
