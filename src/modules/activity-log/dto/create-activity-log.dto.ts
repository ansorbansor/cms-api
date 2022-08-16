import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators';

export class CreateActivityLogDto {
  @ApiProperty({ example: 1 })
  @Validate(IsExist, ['User', 'id'], {
    message: 'User tidak ada',
  })
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '123.123.123.123' })
  ip: string;
}
