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
    console.log(`[ExportController] Request to download job ID: ${id}`);
    try {
      const job = await this.exportService.getJob(id, req.user);
      console.log(`[ExportController] Job found:`, job);

      if (!job || job.status !== 'COMPLETED' || !job.file_path) {
        console.error(`[ExportController] Job not ready or invalid status: ${job?.status}`);
        throw new NotFoundException('File not found or not ready');
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      if (!fs.existsSync(job.file_path)) {
        console.error(`[ExportController] File missing from disk at: ${job.file_path}`);
        throw new NotFoundException('File missing on server');
      }

      console.log(`[ExportController] Sending file: ${job.file_path}`);
      res.download(job.file_path, (err) => {
        if (err) {
          console.error(`[ExportController] Error sending file:`, err);
        } else {
          console.log('[ExportController] File sent successfully');
        }
      });
    } catch (error) {
      console.error(`[ExportController] Download Error:`, error);
      throw error;
    }
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
    @Query('onboard_only') onboardOnly: string,
  ) {
    const response = await this.exportService.exportUser(
      req.user,
      req.ip,
      search,
      onboardOnly === 'true',
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
    @Query('region_id') regionId: string,
    @Query('month') month: string,
    @Query('year') year: string, // already string
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: string,
    @Query('actual_work_status') actualWorkStatus: string,
    @Query('date_filter_by') dateFilterBy: string,
    @Query('project_name') projectName: string,
  ) {
    try {
      const job = await this.exportService.exportPO(
        req.user,
        req.ip,
        startDate,
        endDate,
        search,
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
        actualWorkStatus,
        dateFilterBy,
        projectName
      );

      return res.status(HttpStatus.OK).json({
        meta: { status: 200, message: 'Export queued', success: true },
        data: job,
      });
    } catch (error) {
      console.error('Error in exportPO:', error);
      throw error;
    }
  }

  @Get('spk')
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
    try {
      const job = await this.exportService.exportSPK(
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
    } catch (error) {
      console.error('Error in exportSPK:', error);
      throw error;
    }
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
    try {
      const job = await this.exportService.exportSPKOperational(
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
    } catch (error) {
      console.error('Error in exportSPKOperational:', error);
      throw error;
    }
  }
}
