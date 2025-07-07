import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponseList } from 'src/utils/responses';
import { SPKOperationalRequestTypeService } from './spk-operational-request-type.service';

@ApiBearerAuth()
@Controller({
  version: '1',
})
export class SPKOperationalRequestTypeController {
  constructor(
    private readonly spkOperationalRequestTypeService: SPKOperationalRequestTypeService,
  ) {}
  @Get('spk-operation-request-type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
  ) {
    return successResponseList(
      await this.spkOperationalRequestTypeService.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }
}
