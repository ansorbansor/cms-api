import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateCourseDurationDto {
  @ApiProperty({ example: '1-5 JP' })
  name: string | null;

  @ApiProperty({ example: 40 })
  @IsOptional()
  minimum: number | null;

  @ApiProperty({ example: 200 })
  @IsOptional()
  maximum: number | null;
}
