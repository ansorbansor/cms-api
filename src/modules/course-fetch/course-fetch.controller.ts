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
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { CourseFetchService } from './course-fetch.service';
import { Controllers, Permissions } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { Throttle } from '@nestjs/throttler';

@ApiBearerAuth()
@ApiTags('Course Fetch')
@Controller({
  path: 'fetch-course',
  version: '1',
})
export class CourseFetchController {
  constructor(private readonly courseFetchService: CourseFetchService) {}

  @Get('update-topic')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updateCourseTopic() {
    return await this.courseFetchService.updateCourseFetchTopic();
  }

  @Throttle(1, 60)
  @Get(':id')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: number, @Request() req) {
    return await this.courseFetchService.fetchData(id, req.user.id, req.ip);
  }

  @Delete(':id')
  @Permissions(MenuPermission.CREATE)
  @Controllers(CourseFetchController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAll(@Param('id') id: number, @Request() req) {
    return await this.courseFetchService.deleteAllFetchData(
      id,
      req.user.id,
      req.ip,
    );
  }
}
