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
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { MenuPermission } from 'src/utils/enums';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponService } from './coupon.service';
import { UpdateCouponDto } from './dto/update-coupon.dto';
@ApiBearerAuth()
@ApiTags('Coupon')
@Controller({
  path: 'coupon',
  version: '1',
})
export class CouponController {
  constructor(private readonly couponServices: CouponService) {}

  @Post()
  @Permissions(MenuPermission.CREATE)
  @Controllers(CouponController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCouponDto: CreateCouponDto) {
    return successResponse(
      await this.couponServices.create(createCouponDto),
      'success',
    );
  }

  @Get()
  @Permissions(MenuPermission.READ)
  @Controllers(CouponController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('provider') provider?: number[],
    @Query('status') status?: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.couponServices.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        start_date: start_date,
        end_date: end_date,
        provider: provider,
        status: status,
      }),
      'success',
    );
  }

  @Get(':id')
  @Permissions(MenuPermission.READ)
  @Controllers(CouponController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.couponServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Permissions(MenuPermission.UPDATE)
  @Controllers(CouponController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateCouponDto: UpdateCouponDto) {
    return successResponse(
      await this.couponServices.update(updateCouponDto),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(CouponController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(await this.couponServices.softDelete(id), 'success');
  }
}
