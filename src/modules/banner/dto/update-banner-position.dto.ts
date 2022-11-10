import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBannerPositionDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID banner tidak boleh kosong' })
  banner_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  position: number;
}
