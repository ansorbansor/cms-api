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
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { UsersController } from '../users/users.controller';
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
  @Permissions(MenuPermission.CREATE)
  @Controllers(UsersController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importPO(@UploadedFile() file, @Request() req) {
    return await this.importService.importPO(file, req.user, req.ip);
  }
}
