import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Category A' })
  @IsNotEmpty()
  name?: string | null;
}
