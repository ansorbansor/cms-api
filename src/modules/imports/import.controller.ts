import {
  Controller,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Post,
  Get,
  Query,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { ImportService } from './import.service';

@ApiBearerAuth()
@ApiTags('Imports')
@Controller({
  path: 'import',
  version: '1',
})
export class ImportController {
  constructor(private readonly importService: ImportService) { }

  @Get('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getJobs(@Request() req, @Query('page') page: string) {
    const pageNum = parseInt(page) || 1;
    const result = await this.importService.getJobs(req.user, pageNum);
    return {
      meta: { status: 200, message: 'List Data Import Jobs', success: true },
      ...result,
    };
  }

  @Post('po')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importPO(@UploadedFile() file, @Request() req) {
    const forceCc = req.body.force_cc === 'true';
    return await this.importService.queueImportPO(file, req.user, req.ip, forceCc);
  }

  @Post('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importUser(@UploadedFile() file, @Request() req) {
    return await this.importService.importUser(file, req.user, req.ip);
  }
}
