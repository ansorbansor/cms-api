import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Post,
  Body,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { MenuPermission } from 'src/utils/enums';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { OptionalJwtAuthGuard } from 'src/utils/custom-auth-guard';

@ApiBearerAuth()
@ApiTags('ActivityLogs')
@Controller({
  path: 'acl',
  version: '1',
})
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @Permissions(MenuPermission.READ)
  @Controllers(ActivityLogController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('role') role: number[],
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.activityLogService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        start_date: startDate,
        end_date: endDate,
        role: role,
      }),
      'success',
    );
  }

  @Get(':id')
  @Permissions(MenuPermission.READ)
  @Controllers(ActivityLogController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.activityLogService.findOne({ id: +id }),
      'success',
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  async create(
    @Body() createActivityLogDto: CreateActivityLogDto,
    @Request() req,
  ) {
    if (!req.user.id || req.user.id == undefined) {
      return successResponse(null, 'success');
    }

    const createACL = new CreateActivityLogDto();
    createACL.user_id = req.user.id;
    createACL.ip = req.ip;
    createACL.description = createActivityLogDto.description;

    return successResponse(
      await this.activityLogService.create(createACL),
      'success',
    );
  }
}
