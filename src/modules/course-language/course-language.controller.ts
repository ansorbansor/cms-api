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
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { RoleEnum } from 'src/utils/enums';
import { Roles } from 'src/utils/decorator';
import { CourseLanguageService } from './course-language.service';
import { CreateCourseLanguageDto } from './dto/create-course-language.dto';
import { UpdateCourseLanguageDto } from './dto/update-course-language.dto';

@ApiBearerAuth()
@ApiTags('Course Language')
@Controller({
  path: 'course/language',
  version: '1',
})
export class CourseLanguageController {
  constructor(private readonly courseLanguageServices: CourseLanguageService) {}

  @Post()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCourseLanguageDto: CreateCourseLanguageDto) {
    return this.courseLanguageServices.create(createCourseLanguageDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return this.courseLanguageServices.findManyWithPagination({
      page,
      limit,
      total: 0,
    });
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.courseLanguageServices.findOne({ id: +id });
  }

  @Patch()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  update(@Body() updateCourseLanguageDto: UpdateCourseLanguageDto) {
    return this.courseLanguageServices.update(updateCourseLanguageDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: number) {
    return this.courseLanguageServices.softDelete(id);
  }
}
