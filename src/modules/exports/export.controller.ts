import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Header,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { RolesGuard } from 'src/utils/guards';
import { UsersController } from '../users/users.controller';
import { ExportService } from './export.service';

@ApiBearerAuth()
@ApiTags('Exports')
@Controller({
  version: '1',
})
export class ExportController {
  constructor(private readonly exportService: ExportService) {}
  @Get('export')
  @Header('Content-Type', 'text/xlsx')
  @Permissions(MenuPermission.READ)
  @Controllers(UsersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Res() res: Response,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    const response = await this.exportService.exportUser();

    res.download(`${response}`);
  }
}
