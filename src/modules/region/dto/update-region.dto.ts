import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateRegionDTO {
  @ApiProperty({ example: 'Bandung' })
  @IsNotEmpty({ message: 'Nama Region tidak boleh kosong' })
  @Validate(IsNotExist, ['Region'], {
    message: 'Region telah terdaftar',
  })
  name: string;
}
