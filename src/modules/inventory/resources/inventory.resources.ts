import { Inventory } from 'src/entities/inventory.entity';

export function InventoryResourceDetail(inventory: Inventory) {
  const baseUrl =
    process.env.FILE_BASE_URL || 'https://smarteye-api.ptbiosron.my.id/files';

  return {
    id: inventory.id,
    toolName: inventory.toolName ?? null,
    toolCondition: inventory.toolCondition ?? null,
    latitude: inventory.latitude ?? null,
    longitude: inventory.longitude ?? null,
    toolPhotoUrl: inventory.tool_photo_id
      ? `${baseUrl}/${inventory.tool_photo_id}`
      : null,
    serialNumberPhotoUrl: inventory.serial_number_photo_id
      ? `${baseUrl}/${inventory.serial_number_photo_id}`
      : null,
    userId: inventory.userId,
    createdAt: inventory.createdAt ?? null,
    updatedAt: inventory.updatedAt ?? null,
  };
}
