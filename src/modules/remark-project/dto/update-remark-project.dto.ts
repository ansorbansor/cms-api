import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateRemarkProjectDTO {
  @ApiProperty({ example: '17. ESAR CLOSED - Invoice Closed' })
  @IsNotEmpty({ message: 'Remark Project tidak boleh kosong' })
  @Validate(IsNotExist, ['RemarkProject'], {
    message: 'Remark Project telah terdaftar',
  })
  name: string;
}
