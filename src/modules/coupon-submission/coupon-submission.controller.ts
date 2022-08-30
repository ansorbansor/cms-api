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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { MenuPermission } from 'src/utils/enums';
import { CouponSubmissionService } from './coupon-submission.service';

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
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(@Query('course_id') courseId: number, @Request() req) {
    return await this.couponSubmissionServices.create(req.user.id, courseId);
  }

  @Get()
  @Permissions(MenuPermission.READ)
  @Controllers(CouponSubmissionController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('position_id') position: number,
    @Query('level_id') level: number,
    @Query('blacklist') blacklist: boolean,
    @Query('status') status: number,
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
        employeeLevel: level,
        blacklist: blacklist,
        status: status,
        start_date: startDate,
        end_date: endDate,
      }),
      'success',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.couponSubmissionServices.findOne({ id: +id }),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(CouponSubmissionController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(
      await this.couponSubmissionServices.softDelete(id),
      'success',
    );
  }
}
