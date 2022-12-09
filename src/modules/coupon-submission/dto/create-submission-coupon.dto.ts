import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';
import { ErrorMessage } from 'src/utils/enums';

export class CreateSubmissionCouponDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'ID Course tidak boleh kosong' })
  @IsNumberString(null, { message: ErrorMessage.DATA_TYPE_NOT_EXPECTED })
  course_id: number;
}
