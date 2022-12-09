import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Request,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { MenuPermission } from 'src/utils/enums';
import { CouponSubmissionService } from './coupon-submission.service';
import { IDParamDto } from 'src/utils/id-param.dto';
import { CreateSubmissionCouponDto } from './dto/create-submission-coupon.dto';

@ApiBearerAuth()
@ApiTags('Coupon Submission')
@Controller({
  path: 'coupon-submission',
  version: '1',
})
export class CouponSubmissionController {
  constructor(
    private readonly couponSubmissionServices: CouponSubmissionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Query() param: CreateSubmissionCouponDto, @Request() req) {
    return await this.couponSubmissionServices.create(
      req.user,
      param.course_id,
      req.ip,
    );
  }

  @Get()
  @Permissions(MenuPermission.READ)
  @Controllers(CouponSubmissionController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('position_id') position: number,
    @Query('level_id') level: string[],
    @Query('blacklist') blacklist: string,
    @Query('status') status: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.couponSubmissionServices.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        employeePosition: position,
        level: level,
        blacklist: blacklist,
        status_string: status,
        start_date: startDate,
        end_date: endDate,
      }),
      'success',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.couponSubmissionServices.findOne({ id: +param.id }),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(CouponSubmissionController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto) {
    return successResponse(
      await this.couponSubmissionServices.softDelete(param.id),
      'success',
    );
  }

  @Patch(':id')
  @Permissions(MenuPermission.UPDATE)
  @Controllers(CouponSubmissionController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param() param: IDParamDto,
    @Query('status') status: number,
    @Query('coupon_id') couponId: number,
    @Query('reason') reason: string,
    @Request() req,
  ) {
    return await this.couponSubmissionServices.update(
      param.id,
      status,
      couponId,
      reason,
      req.user,
      req.ip,
    );
  }
}
