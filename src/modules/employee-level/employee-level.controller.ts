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
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { RolesGuard } from 'src/utils/guards';
import { successResponseList } from 'src/utils/responses';
import { EditorChoiceCourseController } from '../editor-choice-course/editor-choice-course.controller';
import { EmployeeLevelService } from './employee-level.service';

@ApiBearerAuth()
@ApiTags('Editor Choice Course')
@Controller({
  version: '1',
})
export class EmployeeLevelController {
  constructor(private readonly employeeLevelService: EmployeeLevelService) {}
  @Get('employee-level')
  @Permissions(MenuPermission.CREATE)
  @Controllers(EditorChoiceCourseController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.employeeLevelService.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }
}
