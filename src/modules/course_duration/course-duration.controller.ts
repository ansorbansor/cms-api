import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { MenuPermission } from 'src/utils/enums';
import { CourseDurationService } from './course-duration.service';
import { CreateCourseDurationDto } from './dto/create-course-duration.dto';
import { UpdateCourseDurationDto } from './dto/update-course-duration.dto';
@ApiBearerAuth()
@ApiTags('Course Duration')
@Controller({
  path: 'course/durations',
  version: '1',
})
export class CourseDurationController {
  constructor(private readonly courseDurationServices: CourseDurationService) {}

  @Post()
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseDurationController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCourseDurationDto: CreateCourseDurationDto) {
    return successResponse(
      await this.courseDurationServices.create(createCourseDurationDto),
      'success',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.courseDurationServices.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.courseDurationServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Permissions(MenuPermission.UPDATE)
  @Controllers(CourseDurationController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateCourseDurationDto: UpdateCourseDurationDto) {
    return successResponse(
      await this.courseDurationServices.update(updateCourseDurationDto),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(CourseDurationController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(
      await this.courseDurationServices.softDelete(id),
      'success',
    );
  }
}
