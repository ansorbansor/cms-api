import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Request,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { CourseFetchService } from './course-fetch.service';
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { Throttle } from '@nestjs/throttler';
import { IDParamDto } from 'src/utils/id-param.dto';

@ApiBearerAuth()
@ApiTags('Course Fetch')
@Controller({
  path: 'fetch-course',
  version: '1',
})
export class CourseFetchController {
  constructor(private readonly courseFetchService: CourseFetchService) {}

  @Get('update-course-topic')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updateCourseTopic() {
    return await this.courseFetchService.updateCourseFetchTopic();
  }

  @Get('update-categories')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updateCategories() {
    return await this.courseFetchService.getUdemyTopics();
  }

  @Get('activate-completed-course')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async activateCompletedCourse() {
    return await this.courseFetchService.activatedCompleteCourse();
  }

  @Throttle(1, 60)
  @Get(':id')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto, @Request() req) {
    return await this.courseFetchService.fetchData(
      param.id,
      req.user.id,
      req.ip,
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAll(@Param() param: IDParamDto, @Request() req) {
    return await this.courseFetchService.deleteAllFetchData(
      param.id,
      req.user.id,
      req.ip,
    );
  }
}
