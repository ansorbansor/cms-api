import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventory } from 'src/entities/inventory.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { FilesService } from '../files/files.service';
import { FilePath } from 'src/utils/enums';
import { InventoryResponseDto } from './dto/inventory-response.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private readonly fileService: FilesService,
  ) {}

  async findAll(user: User) {
    this.logger.log(`Fetching inventories for userId=${user.id}`);
    const inventories = await this.inventoryRepository.find({
      where: { userId: user.id, deletedAt: null },
      relations: ['tool_photo_file', 'serial_number_photo_file'],
    });
    const data = inventories.map((inventory) => new InventoryResponseDto(inventory));
    this.logger.log(`Found ${data.length} inventories for userId=${user.id}`);
    return { data, meta: { code: 200, message: 'Inventories retrieved successfully' } };
  }

  async create(
    createInventoryDto: CreateInventoryDto,
    files: {
      toolPhoto?: Express.Multer.File[];
      serialNumberPhoto?: Express.Multer.File[];
    },
    user: User,
  ) {
    this.logger.log(`Creating inventory for userId=${user.id}`);
    let tool_photo_id: number | null = null;
    let serial_number_photo_id: number | null = null;

    if (files?.toolPhoto?.[0]) {
      this.logger.log('Uploading tool photo');
      const uploadedFile = await this.fileService.uploadFile(
        files.toolPhoto[0],
        user.id,
        FilePath.INVENTORY,
        'Inventory Tool Photo',
      );
      tool_photo_id = uploadedFile.id;
      this.logger.log(`Tool photo uploaded with id=${tool_photo_id}`);
    }

    if (files?.serialNumberPhoto?.[0]) {
      this.logger.log('Uploading serial number photo');
      const uploadedFile = await this.fileService.uploadFile(
        files.serialNumberPhoto[0],
        user.id,
        FilePath.INVENTORY,
        'Inventory Serial Number Photo',
      );
      serial_number_photo_id = uploadedFile.id;
      this.logger.log(`Serial number photo uploaded with id=${serial_number_photo_id}`);
    }

    const newInventory = this.inventoryRepository.create({
      ...createInventoryDto,
      userId: user.id,
      tool_photo_id,
      serial_number_photo_id,
    });

    const saved = await this.inventoryRepository.save(newInventory);
    this.logger.log(`Inventory saved with id=${saved.id}`);

    // Fetch saved inventory with relations to get file entities
    const savedWithRelations = await this.inventoryRepository.findOne({
      where: { id: saved.id },
      relations: ['tool_photo_file', 'serial_number_photo_file'],
    });

    if (!savedWithRelations) {
      this.logger.error(`Failed to fetch saved inventory with id=${saved.id}`);
      throw new NotFoundException('Failed to retrieve created inventory');
    }

    this.logger.log(`Returning created inventory with id=${saved.id}`);
    return { data: new InventoryResponseDto(savedWithRelations) };
  }

  async update(
    id: number,
    updateInventoryDto: CreateInventoryDto,
    files: {
      toolPhoto?: Express.Multer.File[];
      serialNumberPhoto?: Express.Multer.File[];
    },
    user: User,
  ) {
    this.logger.log(`Updating inventory id=${id} for userId=${user.id}`);

    const inventoryItem = await this.inventoryRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!inventoryItem) {
      this.logger.warn(`Inventory id=${id} not found`);
      throw new NotFoundException('Inventory item not found.');
    }
    if (inventoryItem.userId !== user.id) {
      this.logger.warn(`User  id=${user.id} forbidden to update inventory id=${id}`);
      throw new ForbiddenException('You do not have permission to edit this item.');
    }

    const updatePayload: any = {
      ...updateInventoryDto,
      tool_photo_id: inventoryItem.tool_photo_id,
      serial_number_photo_id: inventoryItem.serial_number_photo_id,
    };

    if (files?.toolPhoto?.[0]) {
      this.logger.log('Uploading new tool photo');
      const uploadedFile = await this.fileService.uploadFile(
        files.toolPhoto[0],
        user.id,
        FilePath.INVENTORY,
        'Inventory Tool Photo',
      );
      updatePayload.tool_photo_id = uploadedFile.id;
      this.logger.log(`Tool photo updated with id=${uploadedFile.id}`);
    }

    if (files?.serialNumberPhoto?.[0]) {
      this.logger.log('Uploading new serial number photo');
      const uploadedFile = await this.fileService.uploadFile(
        files.serialNumberPhoto[0],
        user.id,
        FilePath.INVENTORY,
        'Inventory Serial Number Photo',
      );
      updatePayload.serial_number_photo_id = uploadedFile.id;
      this.logger.log(`Serial number photo updated with id=${uploadedFile.id}`);
    }

    await this.inventoryRepository.update(id, updatePayload);
    this.logger.log(`Inventory id=${id} updated`);

    const updatedItem = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['tool_photo_file', 'serial_number_photo_file'],
    });

    if (!updatedItem) {
      this.logger.error(`Failed to fetch updated inventory with id=${id}`);
      throw new NotFoundException('Updated inventory item not found.');
    }

    this.logger.log(`Returning updated inventory with id=${id}`);
    return { data: new InventoryResponseDto(updatedItem) };
  }
}
