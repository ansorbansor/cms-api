import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class GetBannerDto {
  @ApiProperty()
  @IsOptional()
  page?: number = 1;

  @ApiProperty()
  @IsOptional()
  limit?: number = 10;

  @ApiProperty()
  @IsOptional()
  search?: string;

  @ApiProperty()
  @IsOptional()
  status?: string;

  @ApiProperty()
  @IsOptional()
  type?: number;
}
