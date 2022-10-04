import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class UpdateBlacklistUserDto {
  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? 1 : 0))
  blacklist?: number;
}
