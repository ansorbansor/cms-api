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
import { successResponse, successResponseList } from 'src/utils/responses';
import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { OptionalJwtAuthGuard } from 'src/utils/custom-auth-guard';
import { IDParamDto } from 'src/utils/id-param.dto';

@ApiBearerAuth()
@ApiTags('ActivityLogs')
@Controller({
  path: 'acl',
  version: '1',
})
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('role') role: number[],
  ) {
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.activityLogService.findOne({ id: +param.id }),
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
      return successResponse(null, 'Data not inserted');
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
