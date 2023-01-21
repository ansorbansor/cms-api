import {
  Controller,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Post,
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
  constructor(private readonly importService: ImportService) {}

  @Post('po')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importPO(@UploadedFile() file, @Request() req) {
    return await this.importService.importPO(file, req.user, req.ip);
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
