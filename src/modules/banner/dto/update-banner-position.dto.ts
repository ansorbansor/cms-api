import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBannerPositionDto {
  @ApiProperty()
  @IsNotEmpty()
  banner_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  position: number;
}
