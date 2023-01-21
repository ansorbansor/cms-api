import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumberString } from 'class-validator';

export class UpdateSPKSettlementDTO {
  @ApiProperty({ example: '2022-01-01' })
  @IsNotEmpty()
  @IsDateString(null, { message: 'Format tanggal tidak valid' })
  closing_date: string;

  @ApiProperty({ example: 200000 })
  @IsNotEmpty()
  @IsNumberString()
  operation_cost: number;

  @ApiProperty({ example: 'Remarks Lorerm Ipsum' })
  @IsNotEmpty()
  remarks: string;

  @ApiProperty({ example: 3 })
  @IsNumberString()
  status: number;
}
