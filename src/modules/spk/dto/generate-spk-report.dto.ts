import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

// --- TAMBAHKAN KATA KUNCI 'export' DI SINI ---
export class GenerateSpkReportDto {
  @ApiProperty({
    description: 'Array of site codes to generate the report for.',
    type: [String],
    example: ['SITE-001', 'SITE-002'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  site_codes: string[];
}

