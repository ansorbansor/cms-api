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
import { CourseLevelsService } from './course-levels.service';
import { CreateCourseLevelDto } from './dto/create-course-level.dto';
import { UpdateCourseLevelDto } from './dto/update-course-level.dto';

@ApiBearerAuth()
@ApiTags('Course Level')
@Controller({
  path: 'levels',
  version: '1',
})
export class CourseLevelsController {
  constructor(private readonly courseLevelServices: CourseLevelsService) {}

  @Post()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCourseLevelDto: CreateCourseLevelDto) {
    return this.courseLevelServices.create(createCourseLevelDto);
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

    return this.courseLevelServices.findManyWithPagination({
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
    return this.courseLevelServices.findOne({ id: +id });
  }

  @Patch()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  update(@Body() updateCourseLevelDto: UpdateCourseLevelDto) {
    return this.courseLevelServices.update(updateCourseLevelDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: number) {
    return this.courseLevelServices.softDelete(id);
  }
}
