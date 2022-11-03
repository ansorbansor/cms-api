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
import { successResponse, successResponseList } from 'src/utils/responses';
import { CoursePriceService } from './course-price.service';
import { CreateCoursePriceDto } from './dto/create-course-price.dto';
import { UpdateCoursePriceDto } from './dto/update-course-price.dto';

@ApiBearerAuth()
@ApiTags('Course Price')
@Controller({
  path: 'course/price',
  version: '1',
})
export class CoursePriceController {
  constructor(private readonly coursePriceervices: CoursePriceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCoursePriceDto: CreateCoursePriceDto) {
    return successResponse(
      await this.coursePriceervices.create(createCoursePriceDto),
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
      await this.coursePriceervices.findManyWithPagination({
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
      await this.coursePriceervices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateCoursePriceDto: UpdateCoursePriceDto) {
    return successResponse(
      await this.coursePriceervices.update(updateCoursePriceDto),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(
      await this.coursePriceervices.softDelete(id),
      'success',
    );
  }
}
