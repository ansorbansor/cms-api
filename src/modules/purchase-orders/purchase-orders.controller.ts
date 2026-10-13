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
import { CreatePOColumnDTO } from './dto/create-po-column.dto';
import { MenuPermission } from 'src/utils/enums';
import { Menus, Roles } from 'src/utils/decorator';

@ApiBearerAuth()
@ApiTags('Purchase Order')
@Controller({
  version: '1',
})
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) { }

  @Get('po/columns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getColumns() {
    return successResponse(
      await this.poService.listColumns(),
      'Berhasil mengambil daftar kolom PO',
    );
  }

  @Post('po/columns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @Menus(MenuPermission.PO_CREATE)
  async addColumn(
    @Body() createPoColumnDto: CreatePOColumnDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.poService.addColumn(createPoColumnDto, req.user, req.ip),
      'Kolom baru berhasil ditambahkan ke database',
    );
  }

  @Get('po/columns/:columnName/check-safe-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async checkSafeDelete(@Param('columnName') columnName: string) {
    return successResponse(
      await this.poService.checkSafeDeleteColumn(columnName),
      'Hasil pengecekan safe delete kolom',
    );
  }

  @Delete('po/columns/:columnName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Menus(MenuPermission.PO_CREATE)
  async deleteColumn(
    @Param('columnName') columnName: string,
    @Query('confirm') confirm: string,
    @Request() req,
  ) {
    return successResponse(
      await this.poService.deleteColumn(
        columnName,
        confirm === 'true',
        req.user,
        req.ip,
      ),
      'Kolom berhasil dihapus dari database',
    );
  }

  @Patch('po/:id/column-value')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Menus(MenuPermission.PO_CREATE)
  async updateColumnValue(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { column_name: string; value: any },
    @Request() req,
  ) {
    return successResponse(
      await this.poService.updateCustomColumnValue(
        id,
        body.column_name,
        body.value,
        req.user,
        req.ip,
      ),
      'Nilai kolom kustom berhasil diperbarui',
    );
  }

  @Post('po')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @Menus(MenuPermission.PO_CREATE)
  async create(
    @Request() req,
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDTO,
  ) {
    return successResponse(
      PurchaseOrderResource(
        await this.poService.create(
          createPurchaseOrderDto,
          req.user.id,
          req.ip,
          req.body,
        ),
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
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('status') status: string,
    @Query('needs_confirmation') needsConfirmation: string,
    @Query('project_name') projectName: string,
  ) {
    return successResponseList(
      await this.poService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        start_date: startDate,
        end_date: endDate,
        status_string: status,
        needs_confirmation_bool: needsConfirmation === 'true',
        project_name: projectName,
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
  @Menus(MenuPermission.PO_CREATE)
  @Roles(21, 22, 23)
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
        req.body,
      ),
      'success',
    );
  }

  @Delete('po/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Menus(MenuPermission.PO_CREATE)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.poService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
