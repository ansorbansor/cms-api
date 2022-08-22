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
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { Controllers, Permissions } from 'src/utils/decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { successResponse, successResponseList } from 'src/utils/responses';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { MenuPermission } from 'src/utils/enums';
import { OptionalJwtAuthGuard } from 'src/utils/custom-auth-guard';

@ApiBearerAuth()
@ApiTags('Course')
@Controller({
  version: '1',
})
export class CourseController {
  constructor(private readonly courseServices: CourseService) {}

  @Post('courses')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() photo: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.courseServices.create(createCourseDto, photo, request.user),
      'success',
    );
  }

  @Get('courses')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('provider') provider?: number[],
    @Query('category') category?: number[],
    @Query('topic') topic?: number[],
    @Query('level') level?: number[],
    @Query('duration') duration?: number[],
    @Query('language') language?: number[],
    @Query('price') price?: number[],
    @Query('schedule') schedule?: number[],
    @Query('rating') rating?: number[],
    @Query('owned') owned?: boolean,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.courseServices.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        provider: provider,
        category: category,
        topic: topic,
        level: level,
        duration: duration,
        language: language,
        price: price,
        schedule: schedule,
        rating: rating,
        user_id: req.user?.id,
        owned: owned,
      }),
      'success',
    );
  }

  @Get('courses/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.courseServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch('courses')
  @Permissions(MenuPermission.UPDATE)
  @Controllers(CourseController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() photo: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.courseServices.update(updateCourseDto, photo, request.user),
      'success',
    );
  }

  @Delete('courses:id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(CourseController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(await this.courseServices.softDelete(id), 'success');
  }

  @Post('course/like')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async postUserLike(@Query('course_id') courseId: number, @Request() request) {
    return await this.courseServices.postLike(courseId, request.user);
  }
}
