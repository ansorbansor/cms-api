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
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { IDParamDto } from 'src/utils/id-param.dto';
import { SiteService } from './site.service';
import { CreateSiteDTO } from './dto/create-site.dto';
import { SiteResource } from './resources/site.resources';
import { UpdateSiteDTO } from './dto/update-site.dto';

@ApiBearerAuth()
@ApiTags('Site')
@Controller({
  path: 'site',
  version: '1',
})
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createSiteDto: CreateSiteDTO) {
    return successResponse(
      SiteResource(await this.siteService.create(createSiteDto, req.user.id)),
      'success',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.siteService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
      }),
      'success',
    );
  }

  @Get('po/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getPOBySite(@Param() param: IDParamDto) {
    return successResponseList(
      await this.siteService.getPOBySite(param.id),
      'success',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.siteService.findOne({
        id: +param.id,
      }),
      'success',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param() param: IDParamDto,
    @Body() updateSiteDto: UpdateSiteDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.siteService.update(param.id, updateSiteDto, req.user, req.ip),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.siteService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
