import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Res,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Menus } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { ExportService } from './export.service';
import { Response } from 'express';

@ApiBearerAuth()
@ApiTags('Exports')
@Controller({
  path: 'export',
  version: '1',
})
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('users')
  @Header('Content-Type', 'text/xlsx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Menus(MenuPermission.USER_CREATE)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Res() res: Response,
    @Request() req,
    @Query('search') search: string,
  ) {
    const response = await this.exportService.exportUser(
      req.user,
      req.ip,
      search,
    );

    res.download(`${response}`);
  }

  @Get('po')
  @Header('Content-Type', 'text/xlsx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async exportPO(
    @Res() res: Response,
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('search') search: string,
    @Query('status') status: string,
  ) {
    const response = await this.exportService.exportPO(
      req.user,
      req.ip,
      startDate,
      endDate,
      search,
      status,
    );

    res.download(`${response}`);
  }

  @Get('spk')
  @Header('Content-Type', 'text/xlsx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async exportSPK(
    @Res() res: Response,
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('search') search: string,
    @Query('status') status: string,
  ) {
    const response = await this.exportService.exportSPK(
      req.user,
      req.ip,
      startDate,
      endDate,
      search,
      status,
    );

    res.download(`${response}`);
  }
}
