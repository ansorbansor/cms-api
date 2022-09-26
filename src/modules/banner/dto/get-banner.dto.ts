import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => value === 'true')
  status?: boolean;

  @ApiProperty()
  @IsOptional()
  type?: number;
}
