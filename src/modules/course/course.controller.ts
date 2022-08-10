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
import { RoleEnum } from 'src/utils/enums';
import { Roles } from 'src/utils/decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/utils/file-helper';
import { successResponse, successResponseList } from 'src/utils/responses';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiBearerAuth()
@ApiTags('Course')
@Controller({
  path: 'courses',
  version: '1',
})
export class CourseController {
  constructor(private readonly courseServices: CourseService) {}

  @Post()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() photo: Express.Multer.File,
    @Request() request,
  ) {
    return successResponse(
      this.courseServices.create(createCourseDto, photo, request.user),
      'success',
    );
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.user)
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
      await this.courseServices.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.courseServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  update(
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() photo: Express.Multer.File,
    @Request() request,
  ) {
    return successResponse(
      this.courseServices.update(updateCourseDto, photo, request.user),
      'success',
    );
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: number) {
    return successResponse(this.courseServices.softDelete(id), 'success');
  }
}
