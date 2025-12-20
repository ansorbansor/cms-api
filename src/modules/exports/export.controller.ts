import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Res,
  Request,
  UseGuards,
  Param,
  NotFoundException,
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
  constructor(private readonly exportService: ExportService) { }

  @Get('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getJobs(@Request() req) {
    const jobs = await this.exportService.getJobs(req.user);
    return {
      meta: { status: 200, message: 'List Data Export Jobs', success: true },
      data: jobs,
    };
  }

  @Get('download/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async download(@Param('id') id: string, @Res() res: Response, @Request() req) {
    const job = await this.exportService.getJob(id, req.user);
    if (!job || job.status !== 'COMPLETED' || !job.file_path) {
      throw new NotFoundException('File not found or not ready');
    }
    res.download(job.file_path);
  }

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
    const job = await this.exportService.exportPO(
      req.user,
      req.ip,
      startDate,
      endDate,
      search,
      status,
    );

    return res.status(HttpStatus.OK).json({
      meta: { status: 200, message: 'Export queued', success: true },
      data: job,
    });
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

  @Get('absence')
  @Header('Content-Type', 'text/xlsx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async exportAbsence(
    @Res() res: Response,
    @Request() req,
    @Query('search') search: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const response = await this.exportService.exportAbsence(
      req.user,
      req.ip,
      search,
      startDate,
      endDate,
    );

    res.download(`${response}`);
  }
  @Get('spk-operational')
  @Header('Content-Type', 'text/xlsx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async exportSPKOperational(
    @Res() res: Response,
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('search') search: string,
    @Query('status') status: string,
  ) {
    const response = await this.exportService.exportSPKOperational(
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
