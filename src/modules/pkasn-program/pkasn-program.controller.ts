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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponseList } from 'src/utils/responses';
import { PKASNProgramService } from './pkasn-program.service';

@ApiBearerAuth()
@ApiTags('PKASN Program')
@Controller({
  path: 'pkasn-program',
  version: '1',
})
export class PKASNProgramController {
  constructor(private readonly pkasnProgramService: PKASNProgramService) {}
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.pkasnProgramService.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }
}
