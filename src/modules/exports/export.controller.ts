import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  UseGuards,
  Header,
  Res,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { UsersController } from '../users/users.controller';
import { ExportService } from './export.service';

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
  @Permissions(MenuPermission.READ)
  @Controllers(UsersController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(@Res() res: Response, @Request() req) {
    const response = await this.exportService.exportUser(req.user, req.ip);

    res.download(`${response}`);
  }
}
