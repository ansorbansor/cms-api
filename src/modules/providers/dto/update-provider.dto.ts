import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateProviderDto {
  @ApiProperty({ example: 'MOOC A' })
  @IsNotEmpty()
  name?: string | null;
}
