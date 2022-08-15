import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateUserTopicDto {
  @ApiProperty({ example: 1, type: Number })
  @IsNotEmpty()
  category_id: number;

  @ApiProperty({ example: [2, 3, 4], type: Number })
  @IsNotEmpty()
  topic_id: number[];
}
