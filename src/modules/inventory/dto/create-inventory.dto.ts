// src/modules/inventory/dto/create-inventory.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateInventoryDto {
  @ApiPropertyOptional({ description: 'Name of the tool', type: String, nullable: true })
  @IsOptional()
  @IsString()
  toolName?: string | null;

  @ApiPropertyOptional({ description: 'Condition of the tool', type: String, nullable: true })
  @IsOptional()
  @IsString()
  toolCondition?: string | null;

  @ApiPropertyOptional({ description: 'Latitude coordinate', type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ description: 'Longitude coordinate', type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;
}
