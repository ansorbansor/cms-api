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
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { PurchaseOrderService } from './purchase-orders.service';
import { CreatePurchaseOrderDTO } from './dto/create-po.dto';
import { PurchaseOrderResource } from './resources/purchase-order.resources';
import { IDParamDto } from 'src/utils/id-param.dto';
import { UpdatePurchaseOrderDTO } from './dto/update-po.dto';

@ApiBearerAuth()
@ApiTags('Purchase Order')
@Controller({
  version: '1',
})
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post('po')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDTO,
  ) {
    return successResponse(
      PurchaseOrderResource(
        await this.poService.create(createPurchaseOrderDto, req.user.id),
      ),
      'success',
    );
  }

  @Get('po')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return successResponseList(
      await this.poService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
      }),
      'success',
    );
  }

  @Get('po/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.poService.findOne({
        id: +param.id,
      }),
      'success',
    );
  }

  @Patch('po')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.poService.update(
        updatePurchaseOrderDto.id,
        updatePurchaseOrderDto,
        req.user,
        req.ip,
      ),
      'success',
    );
  }

  @Delete('po/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.poService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
