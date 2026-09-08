import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreatePerjalananDinasDTO } from './create-perjalanan-dinas.dto';

export class UpdatePerjalananDinasDTO extends PartialType(CreatePerjalananDinasDTO) {
  @ApiProperty({ example: 'Approved' })
  @IsOptional()
  @IsString()
  status?: string;
}
