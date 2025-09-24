import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Param,
  UploadedFiles,
  UseInterceptors,
  Version,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InventoryService } from './inventory.service';
import { User } from 'src/entities/user.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { JwtAuthGuard } from 'src/utils/guards';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { successResponse } from 'src/utils/responses';

@ApiBearerAuth()
@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ===== GET /inventory =====
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: { user: User }) {
    if (!req.user) {
      throw new UnauthorizedException('User   not authenticated');
    }

    const inventories = await this.inventoryService.findAll(req.user);
    const safeData = inventories.data;

    return successResponse(safeData, 'Inventories retrieved successfully');
  }

  // ===== POST /inventory =====
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'toolPhoto', maxCount: 1 },
      { name: 'serialNumberPhoto', maxCount: 1 },
    ])
  )
  async create(
    @UploadedFiles() files: { toolPhoto?: Express.Multer.File[]; serialNumberPhoto?: Express.Multer.File[] },
    @Req() req: { user: User; body: CreateInventoryDto },
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User   not authenticated');
    }

    console.log('Inventory create called');
    console.log('Received files:', files);
    console.log('Request body:', req.body);

    try {
      const inventory = await this.inventoryService.create(
        {
          toolName: req.body.toolName ?? null,
          toolCondition: req.body.toolCondition ?? null,
	  remark: req.body.remark ?? null, // ✅ Get remark from the body
          latitude: req.body.latitude !== undefined ? Number(req.body.latitude) : null,
          longitude: req.body.longitude !== undefined ? Number(req.body.longitude) : null,
        },
        files,
        req.user,
      );

      console.log('Inventory created:', inventory);

      return successResponse(inventory.data, 'Inventory created successfully');
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  // ===== PUT /inventory/:id =====
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'toolPhoto', maxCount: 1 },
      { name: 'serialNumberPhoto', maxCount: 1 },
    ])
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: { toolPhoto?: Express.Multer.File[]; serialNumberPhoto?: Express.Multer.File[] },
    @Req() req: { user: User; body: CreateInventoryDto },
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User   not authenticated');
    }

    console.log(`Inventory update called for id ${id}`);
    console.log('Received files:', files);
    console.log('Request body:', req.body);

    try {
      const inventory = await this.inventoryService.update(
        +id,
        {
          toolName: req.body.toolName ?? null,
          toolCondition: req.body.toolCondition ?? null,
	  remark: req.body.remark ?? null, // ✅ Get remark from the body
          latitude: req.body.latitude !== undefined ? Number(req.body.latitude) : null,
          longitude: req.body.longitude !== undefined ? Number(req.body.longitude) : null,
        },
        files,
        req.user,
      );

      console.log('Inventory updated:', inventory);

      return successResponse(inventory.data, 'Inventory updated successfully');
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }
}
