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
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { IDParamDto } from 'src/utils/id-param.dto';
import { RegionService } from './region.service';
import { CreateRegionDTO } from './dto/create-region.dto';
import { RegionResource } from './resources/region.resources';
import { UpdateRegionDTO } from './dto/update-region.dto';

@ApiBearerAuth()
@ApiTags('Region')
@Controller({
  path: 'region',
  version: '1',
})
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createRegionDto: CreateRegionDTO) {
    return successResponse(
      RegionResource(
        await this.regionService.create(createRegionDto, req.user.id),
      ),
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
      await this.regionService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
      }),
      'success',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.regionService.findOne({
        id: +param.id,
      }),
      'success',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param() param: IDParamDto,
    @Body() updateRegionDto: UpdateRegionDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.regionService.update(
        param.id,
        updateRegionDto,
        req.user,
        req.ip,
      ),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.regionService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
