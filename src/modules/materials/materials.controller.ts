import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { IDParamDto } from 'src/utils/id-param.dto';
import { MaterialsService } from './materials.service';
import { CreateMaterialDTO, CreateMaterialTransactionDTO } from './dto/create-material.dto';
import { UpdateMaterialDTO } from './dto/update-material.dto';

@ApiBearerAuth()
@ApiTags('Materials')
@Controller({
  path: 'materials',
  version: '1',
})
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateMaterialDTO) {
    return successResponse(
      await this.materialsService.create(createDto),
      'success',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('category') category: string,
    @Query('status') status: string,
  ) {
    return successResponseList(
      await this.materialsService.findAll(page, limit, search, category, status),
      'success',
    );
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getSummary() {
    return successResponse(
      await this.materialsService.getSummary(),
      'success',
    );
  }

  @Get('by-serial/:sn')
  @HttpCode(HttpStatus.OK)
  async findBySerial(@Param('sn') sn: string) {
    return successResponse(
      await this.materialsService.findBySerial(sn),
      'success',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.materialsService.findOne(+param.id),
      'success',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param() param: IDParamDto,
    @Body() updateDto: UpdateMaterialDTO,
  ) {
    return successResponse(
      await this.materialsService.update(+param.id, updateDto),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto) {
    return successResponse(
      await this.materialsService.softDelete(+param.id),
      'success',
    );
  }

  @Patch(':id/confirm-delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async confirmDelivery(
    @Param() param: IDParamDto,
    @Request() req,
  ) {
    return successResponse(
      await this.materialsService.confirmDelivery(+param.id, req.user.id),
      'success',
    );
  }

  @Post(':id/transaction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async addTransaction(
    @Param() param: IDParamDto,
    @Body() dto: CreateMaterialTransactionDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.materialsService.addTransaction(+param.id, dto, req.user.id),
      'success',
    );
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  async getHistory(@Param() param: IDParamDto) {
    return successResponse(
      await this.materialsService.getHistory(+param.id),
      'success',
    );
  }
}
