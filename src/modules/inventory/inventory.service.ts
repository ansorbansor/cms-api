import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventory } from 'src/entities/inventory.entity';
import { User } from 'src/entities/user.entity';
import { Repository, IsNull } from 'typeorm';
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly fileService: FilesService,
  ) {}

  async getSummary(options: { search?: string; page: number; limit: number }) {
    this.logger.log(`Fetching inventory summary with options: ${JSON.stringify(options)}`);

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.user', 'user')
      .leftJoin('user.employeePosition', 'position')
      .select([
        'user.id AS "userId"',
        'user.name AS "userName"',
        'position.name AS "position"',
        `COUNT(CASE WHEN inventory.toolCondition = 'Good' THEN 1 END) AS "good_qty"`,
        `COUNT(CASE WHEN inventory.toolCondition = 'Broken' THEN 1 END) AS "broken_qty"`,
        `COUNT(CASE WHEN inventory.toolCondition = 'Needs Maintenance' THEN 1 END) AS "maintenance_qty"`,
        'COUNT(inventory.id) AS "total_qty"',
      ])
      .where('inventory.deletedAt IS NULL')
      .groupBy('user.id')
      .addGroupBy('user.name')
      .addGroupBy('position.name');

    if (options.search) {
      this.logger.log(`Applying search filter: ${options.search}`);
      queryBuilder.andWhere('user.name ILIKE :search', {
        search: `%${options.search}%`,
      });
    }

    const totalItems = (await queryBuilder.getRawMany()).length;
    this.logger.log(`Found ${totalItems} total summary records`);

    const results = await queryBuilder
      .offset((options.page - 1) * options.limit)
      .limit(options.limit)
      .getRawMany();

    const formattedData = results.map((item) => ({
      user: {
        id: item.userId,
        name: item.userName,
        position: item.position,
      },
      good_qty: parseInt(item.good_qty, 10) || 0,
      broken_qty: parseInt(item.broken_qty, 10) || 0,
      maintenance_qty: parseInt(item.maintenance_qty, 10) || 0,
      total_qty: parseInt(item.total_qty, 10) || 0,
    }));

    return {
      data: formattedData,
      total: totalItems,
      page: options.page,
      limit: options.limit,
    };
  }

  async findUserInventory(userId: number) {
    this.logger.log(`Fetching inventory details for userId=${userId}`);

    // Find the user by their ID, including their position details
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['employeePosition'],
    });

    // If no user is found, throw a 404 error
    if (!user) {
      this.logger.warn(`User with id=${userId} not found.`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // Find all inventory items for the specified user
    const inventories = await this.inventoryRepository.find({
      where: { userId: userId, deletedAt: IsNull() },
      relations: ['tool_photo_file', 'serial_number_photo_file'],
      order: { updatedAt: 'DESC' }, // Optional: sort by most recently updated
    });
    this.logger.log(`Found ${inventories.length} inventories for userId=${userId}`);

    // Format the response to match what the frontend expects
    const formattedInventories = inventories.map((inv) => new InventoryResponseDto(inv));
    const userData = {
      id: user.id,
      name: user.name,
      position: user.employeePosition ? user.employeePosition.name : 'N/A',
    };

    return {
      user: userData,
      inventories: formattedInventories,
    };
  }

  async findAll(user: User) {
    this.logger.log(`Fetching inventories for userId=${user.id}`);
    const inventories = await this.inventoryRepository.find({
      where: { userId: user.id, deletedAt: IsNull() },
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
      where: { id, deletedAt: IsNull() },
    });

    if (!inventoryItem) {
      this.logger.warn(`Inventory id=${id} not found`);
      throw new NotFoundException('Inventory item not found.');
    }
    if (inventoryItem.userId !== user.id) {
      this.logger.warn(`User id=${user.id} forbidden to update inventory id=${id}`);
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
      this.logger.log(`Serial number photo uploaded with id=${uploadedFile.id}`);
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

