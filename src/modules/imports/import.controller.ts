import {
  Controller,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Post,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { BufferedFile } from 'src/utils/file-helper';
import { RolesGuard } from 'src/utils/guards';
import { successResponse } from 'src/utils/responses';
import { UsersController } from '../users/users.controller';
import { ImportService } from './import.service';
import { Response } from 'express';

@ApiBearerAuth()
@ApiTags('Imports')
@Controller({
  path: 'import',
  version: '1',
})
export class ImportController {
  constructor(private readonly importService: ImportService) {}
  @Post('user')
  @Permissions(MenuPermission.CREATE)
  @Controllers(UsersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importUser(@UploadedFile() file: BufferedFile) {
    return successResponse(null, await this.importService.importUser(file));
  }

  @Post('user-blacklist')
  @Permissions(MenuPermission.CREATE)
  @Controllers(UsersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importBlacklistUser(@UploadedFile() file: BufferedFile) {
    return successResponse(
      null,
      await this.importService.importBlacklistUser(file),
    );
  }

  @Post('user-level')
  @Permissions(MenuPermission.CREATE)
  @Controllers(UsersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importLevelUser(@UploadedFile() file: BufferedFile) {
    return successResponse(
      null,
      await this.importService.importLevelUser(file),
    );
  }

  @Post('coupon')
  @Permissions(MenuPermission.CREATE)
  @Controllers(UsersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importCoupon(@UploadedFile() file: BufferedFile) {
    return successResponse(null, await this.importService.importCoupon(file));
  }

  @Get(':path')
  @ApiParam({ name: 'path', example: 'user.xlsx' })
  async download(@Param('path') path, @Res() res: Response) {
    const response = await this.importService.downloadTemplate(path);

    res.download(`${response}`);
  }
}
