import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateSPKOperationalSettlementDTO {
  @ApiProperty({ example: '2022-01-01' })
  @IsOptional()
  @IsDateString(null, { message: 'Format tanggal tidak valid' })
  closing_date: string;

  @ApiProperty({ example: 200000 })
  @IsOptional()
  @IsNumberString()
  operation_cost: number;

  @ApiProperty({ example: 'Remarks Lorerm Ipsum' })
  @IsOptional()
  remarks: string;

  @ApiProperty({ example: 3 })
  @IsNumberString()
  status: number;

  @ApiProperty({ example: '2022-01-01 10:00:00' })
  @IsOptional()
  @IsString()
  paid_date: string;
}
