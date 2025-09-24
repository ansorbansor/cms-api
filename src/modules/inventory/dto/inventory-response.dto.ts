// src/modules/inventory/dto/inventory-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Inventory } from 'src/entities/inventory.entity';

export class InventoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional({ nullable: true })
  toolName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  toolCondition?: string | null;

  @ApiPropertyOptional({ nullable: true })
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  longitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  toolPhotoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  serialNumberPhotoUrl?: string | null;

  @ApiProperty()
  userId: number;

  @ApiPropertyOptional()
  createdAt?: Date | null;

  @ApiPropertyOptional()
  updatedAt?: Date | null;

  constructor(inventory: Inventory) {
    this.id = inventory.id;
    this.toolName = inventory.toolName ?? null;
    this.toolCondition = inventory.toolCondition ?? null;
    this.latitude = inventory.latitude ?? null;
    this.longitude = inventory.longitude ?? null;

    this.toolPhotoUrl = inventory.tool_photo_file
      ? this.buildFileUrl(inventory.tool_photo_file.path)
      : null;

    this.serialNumberPhotoUrl = inventory.serial_number_photo_file
      ? this.buildFileUrl(inventory.serial_number_photo_file.path)
      : null;

    this.userId = inventory.userId;
    this.createdAt = inventory.createdAt ?? null;
    this.updatedAt = inventory.updatedAt ?? null;
  }

  private buildFileUrl(filePath: string): string {
    // Use BACKEND_DOMAIN from config which should match your production domain
    const baseUrl = process.env.BACKEND_DOMAIN || process.env.APP_BASE_URL || 'http://localhost:3000';
    const apiPrefix = process.env.API_PREFIX || 'api';
    const apiVersion = process.env.API_VERSION || 'v1';
    // Extract just the filename from the path to match files controller endpoint
    const filename = filePath.split('/').pop();
    return `${baseUrl}/${apiPrefix}/${apiVersion}/files/${filename}`;
  }
}
