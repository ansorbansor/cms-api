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
import { CourseLanguageService } from './course-language.service';
import { CreateCourseLanguageDto } from './dto/create-course-language.dto';
import { UpdateCourseLanguageDto } from './dto/update-course-language.dto';
import { successResponse, successResponseList } from 'src/utils/responses';

@ApiBearerAuth()
@ApiTags('Course Language')
@Controller({
  path: 'course/language',
  version: '1',
})
export class CourseLanguageController {
  constructor(private readonly courseLanguageServices: CourseLanguageService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCourseLanguageDto: CreateCourseLanguageDto) {
    return successResponse(
      await this.courseLanguageServices.create(createCourseLanguageDto),
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
      await this.courseLanguageServices.findManyWithPagination({
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
      await this.courseLanguageServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateCourseLanguageDto: UpdateCourseLanguageDto) {
    return successResponse(
      await this.courseLanguageServices.update(updateCourseLanguageDto),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(
      await this.courseLanguageServices.softDelete(id),
      'success',
    );
  }
}
