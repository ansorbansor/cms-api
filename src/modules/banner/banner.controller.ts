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
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { MenuPermission } from 'src/utils/enums';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';

@ApiBearerAuth()
@ApiTags('Banner')
@Controller({
  path: 'banners',
  version: '1',
})
export class BannerController {
  constructor(private readonly bannerServices: BannerService) {}

  @Post()
  @Permissions(MenuPermission.CREATE)
  @Controllers(BannerController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createBannerDto: CreateBannerDto,
    @Request() req,
    @UploadedFile() photo: BufferedFile,
  ) {
    return successResponse(
      await this.bannerServices.create(createBannerDto, req.user, photo),
      'success',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('status') status: boolean,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.bannerServices.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        status_bool: status,
      }),
      'success',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.bannerServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Permissions(MenuPermission.UPDATE)
  @Controllers(BannerController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  @HttpCode(HttpStatus.OK)
  async update(
    @Body() updateBannerDto: UpdateBannerDto,
    @Request() req,
    @UploadedFile() photo: BufferedFile,
  ) {
    return successResponse(
      await this.bannerServices.update(updateBannerDto, req.user, photo),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(BannerController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(await this.bannerServices.softDelete(id), 'success');
  }
}
