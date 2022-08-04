import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'MOOC A' })
  @IsNotEmpty()
  name: string | null;
}
