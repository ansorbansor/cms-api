import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateActivityLogDto {
  @ApiProperty({ example: 1 })
  user_id: number;

  @ApiProperty({ example: 'Lorem ipsum' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '123.123.123.123' })
  ip: string;
}
