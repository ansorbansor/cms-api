import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';
import { ErrorMessage } from './enums';

export class IDParamDto {
  @ApiProperty({ example: 1, type: Number })
  @IsNotEmpty({ message: 'ID tidak boleh kosong' })
  @IsNumberString(null, { message: ErrorMessage.DATA_TYPE_NOT_EXPECTED })
  id: number;
}
