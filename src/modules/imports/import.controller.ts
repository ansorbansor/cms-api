import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { BufferedFile } from 'src/utils/file-helper';
import { RolesGuard } from 'src/utils/guards';
import { successResponse } from 'src/utils/responses';
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
  @Get('user')
  @Permissions(MenuPermission.CREATE)
  @Controllers(UsersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importUser(@UploadedFile() file: BufferedFile) {
    await this.importService.importUser(file);

    return successResponse(null, 'success');
  }
}
