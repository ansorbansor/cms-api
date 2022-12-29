import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateSiteDTO {
  @ApiProperty({ example: 'PRAMASITALAMASMD (3 System)' })
  @IsNotEmpty({ message: 'Nama Site tidak boleh kosong' })
  @Validate(IsNotExist, ['Site'], {
    message: 'Site Name telah terdaftar',
  })
  name: string;

  @ApiProperty({ example: 'GIN199_2System_S_Bali' })
  @IsNotEmpty({ message: 'Nama Site tidak boleh kosong' })
  @Validate(IsNotExist, ['Site'], {
    message: 'Site Code telah terdaftar',
  })
  code: string;
}
