import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { ErrorMessage } from 'src/utils/enums';
import { IsExist } from 'src/utils/validators';

export class CreateUserNotificationDto {
  @Validate(IsExist, ['User', 'id'], {
    message: ErrorMessage.EMAIL_NOT_EXISTS,
  })
  user_id: number;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  type: number;

  @IsNotEmpty()
  source: number;

  @IsOptional()
  extra_data: string;

  @ApiProperty({ name: 'status' })
  @IsOptional()
  status: number;
}
