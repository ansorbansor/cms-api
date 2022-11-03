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
import { CourseLevelsService } from './course-levels.service';
import { CreateCourseLevelDto } from './dto/create-course-level.dto';
import { UpdateCourseLevelDto } from './dto/update-course-level.dto';
import { successResponse, successResponseList } from 'src/utils/responses';

@ApiBearerAuth()
@ApiTags('Course Level')
@Controller({
  path: 'course/levels',
  version: '1',
})
export class CourseLevelsController {
  constructor(private readonly courseLevelServices: CourseLevelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCourseLevelDto: CreateCourseLevelDto) {
    return successResponse(
      await this.courseLevelServices.create(createCourseLevelDto),
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
      await this.courseLevelServices.findManyWithPagination({
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
      await this.courseLevelServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateCourseLevelDto: UpdateCourseLevelDto) {
    return successResponse(
      await this.courseLevelServices.update(updateCourseLevelDto),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(
      await this.courseLevelServices.softDelete(id),
      'success',
    );
  }
}
