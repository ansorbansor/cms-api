import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ParseArrayPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { MenuPermission } from 'src/utils/enums';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { UpdateBannerPositionDto } from './dto/update-banner-position.dto';
import { GetBannerDto } from './dto/get-banner.dto';

@ApiBearerAuth()
@ApiTags('Banner')
@Controller({
  version: '1',
})
export class BannerController {
  constructor(private readonly bannerServices: BannerService) {}

  @Post('banners')
  @Permissions(MenuPermission.CREATE)
  @Controllers(BannerController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createBannerDto: CreateBannerDto,
    @Request() req,
    @UploadedFile() photo: BufferedFile,
  ) {
    return successResponse(
      await this.bannerServices.create(
        createBannerDto,
        req.user,
        photo,
        req.ip,
      ),
      'success',
    );
  }

  @Patch('banner-position')
  @Permissions(MenuPermission.CREATE)
  @Controllers(BannerController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async updatePosition(
    @Body(
      new ParseArrayPipe({ items: UpdateBannerPositionDto, whitelist: true }),
    )
    updateBannerPositionDto: UpdateBannerPositionDto[],
  ) {
    return successResponse(
      await this.bannerServices.updatePosition(updateBannerPositionDto),
      'Berhasil ubah posisi banner',
    );
  }

  @Get('banners')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryParams: GetBannerDto) {
    if (queryParams.limit > 50) {
      queryParams.limit = 50;
    }

    return successResponseList(
      await this.bannerServices.findManyWithPagination({
        page: queryParams.page,
        limit: queryParams.limit,
        total: 0,
        search: queryParams.search,
        status_string: queryParams.status,
        type: queryParams.type,
        is_admin: false,
      }),
      'success',
    );
  }

  @Get('admin/banners')
  @Permissions(MenuPermission.READ)
  @Controllers(BannerController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAllAdmin(@Query() queryParams: GetBannerDto) {
    if (queryParams.limit > 50) {
      queryParams.limit = 50;
    }

    return successResponseList(
      await this.bannerServices.findManyWithPagination({
        page: queryParams.page,
        limit: queryParams.limit,
        total: 0,
        search: queryParams.search,
        status_string: queryParams.status,
        type: queryParams.type,
        is_admin: true,
      }),
      'success',
    );
  }

  @Get('banners/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.bannerServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch('banners')
  @Permissions(MenuPermission.UPDATE)
  @Controllers(BannerController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  @HttpCode(HttpStatus.OK)
  async update(
    @Body() updateBannerDto: UpdateBannerDto,
    @Request() req,
    @UploadedFile() photo: BufferedFile,
  ) {
    return successResponse(
      await this.bannerServices.update(
        updateBannerDto,
        req.user,
        photo,
        req.ip,
      ),
      'success',
    );
  }

  @Delete('banners/:id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(BannerController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number, @Request() req) {
    return successResponse(
      await this.bannerServices.softDelete(id, req.user, req.ip),
      'success',
    );
  }
}
