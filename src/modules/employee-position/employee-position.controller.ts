import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { EmployeePositionService } from './employee-position.service';

@ApiBearerAuth()
@ApiTags('Editor Choice Course')
@Controller({
  version: '1',
})
export class EmployeePositionController {
  constructor(
    private readonly employeePositionService: EmployeePositionService,
  ) {}
  @Get('employee-position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
  ) {
    return successResponseList(
      await this.employeePositionService.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }

  @Patch('employee-position/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: { sub_roles?: string[]; name?: string; grant_all_access?: boolean },
  ) {
    const updated = await this.employeePositionService.update(+id, body);
    return successResponse(updated, 'Employee position updated successfully');
  }
}
