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
  UseInterceptors,
  Request,
  UploadedFile,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { Controllers, Permissions } from 'src/utils/decorator';
import { CourseCategoriesService } from './course-categories.service';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { successResponse, successResponseList } from 'src/utils/responses';
import { MenuPermission } from 'src/utils/enums';
@ApiBearerAuth()
@ApiTags('Course Categories')
@Controller({
  path: 'course/categories',
  version: '1',
})
export class CourseCategoriesController {
  constructor(private readonly categoryServices: CourseCategoriesService) {}

  @Post()
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseCategoriesController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createCourseCategoryDto: CreateCourseCategoryDto,
    @UploadedFile() photo: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.categoryServices.create(
        createCourseCategoryDto,
        photo,
        request.user,
        request.ip,
      ),
      'success',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('with_topics', new DefaultValuePipe(true), ParseBoolPipe)
    withTopics?: boolean,
    @Query('search') search?: string,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return await this.categoryServices.findManyWithPagination(
      {
        page,
        limit,
        total: 0,
        search: search,
      },
      withTopics,
    );

    return successResponseList(
      await this.categoryServices.findManyWithPagination(
        {
          page,
          limit,
          total: 0,
          search: search,
        },
        withTopics,
      ),
      'success',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Query('with_topics', new DefaultValuePipe(true), ParseBoolPipe)
    withTopics?: boolean,
  ) {
    return successResponse(
      await this.categoryServices.findOne({ id: +id }, withTopics),
      'success',
    );
  }

  @Patch()
  @Permissions(MenuPermission.UPDATE)
  @Controllers(CourseCategoriesController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Body() updateCourseCategoryDto: UpdateCourseCategoryDto,
    @UploadedFile() photo: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.categoryServices.update(
        updateCourseCategoryDto,
        photo,
        request.user,
        request.ip,
      ),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(CourseCategoriesController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number, @Request() req) {
    return successResponse(
      await this.categoryServices.softDelete(id, req.user, req.ip),
      'success',
    );
  }
}
