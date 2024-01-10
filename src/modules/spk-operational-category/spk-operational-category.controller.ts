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
import { SPKOperationalCategoryService } from './spk-operational-category.service';

@ApiBearerAuth()
@Controller({
  version: '1',
})
export class SPKOperationalCategoryController {
  constructor(
    private readonly spkOperationalRequestTypeService: SPKOperationalCategoryService,
  ) {}
  @Get('spk-operation-category')
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
