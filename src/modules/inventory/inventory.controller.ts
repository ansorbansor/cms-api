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
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InventoryService } from './inventory.service';
import { User } from 'src/entities/user.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { JwtAuthGuard } from 'src/utils/guards';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { successResponse, successResponseList } from 'src/utils/responses';

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
      throw new UnauthorizedException('User not authenticated');
    }

    const inventories = await this.inventoryService.findAll(req.user);
    return successResponse(inventories.data, 'Inventories retrieved successfully');
  }

  // ===== GET /inventory/summary =====
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary(
    @Req() req: { user: User },
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const summaryData = await this.inventoryService.getSummary({
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return successResponseList(summaryData, 'Inventory summaries retrieved successfully');
  }

  // ===== NEW ENDPOINT: GET /inventory/user/:id =====
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Get('user/:id') // This route now matches the frontend request
  @HttpCode(HttpStatus.OK)
  async findUserInventory(@Param('id', ParseIntPipe) id: number) {
    const data = await this.inventoryService.findUserInventory(id);
    return successResponse(data, 'User inventory retrieved successfully');
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
    ]),
  )
  async create(
    @UploadedFiles()
    files: { toolPhoto?: Express.Multer.File[]; serialNumberPhoto?: Express.Multer.File[] },
    @Req() req: { user: User; body: CreateInventoryDto },
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      const inventory = await this.inventoryService.create(
        {
          toolName: req.body.toolName ?? null,
          toolCondition: req.body.toolCondition ?? null,
          remark: req.body.remark ?? null,
          latitude: req.body.latitude !== undefined ? Number(req.body.latitude) : null,
          longitude: req.body.longitude !== undefined ? Number(req.body.longitude) : null,
        },
        files,
        req.user,
      );

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
    ]),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: { toolPhoto?: Express.Multer.File[]; serialNumberPhoto?: Express.Multer.File[] },
    @Req() req: { user: User; body: CreateInventoryDto },
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      const inventory = await this.inventoryService.update(
        +id,
        {
          toolName: req.body.toolName ?? null,
          toolCondition: req.body.toolCondition ?? null,
          remark: req.body.remark ?? null,
          latitude: req.body.latitude !== undefined ? Number(req.body.latitude) : null,
          longitude: req.body.longitude !== undefined ? Number(req.body.longitude) : null,
        },
        files,
        req.user,
      );

      return successResponse(inventory.data, 'Inventory updated successfully');
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }
}
