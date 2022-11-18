import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class GeneratePartnerDto {
  @ApiProperty({ example: 'Pionir' })
  @IsNotEmpty({ message: 'Nama client tidak boleh kosong' })
  @Validate(IsNotExist, ['OauthClient', 'name'], {
    message: 'Nama client sudah ada',
  })
  name: string;
}
