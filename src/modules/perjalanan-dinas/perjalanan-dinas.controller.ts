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
import { PerjalananDinasService } from './perjalanan-dinas.service';
import { CreatePerjalananDinasDTO } from './dto/create-perjalanan-dinas.dto';
import { UpdatePerjalananDinasDTO } from './dto/update-perjalanan-dinas.dto';
import { PerjalananDinasResource } from './resources/perjalanan-dinas.resources';

@ApiBearerAuth()
@ApiTags('Perjalanan Dinas')
@Controller({
  path: 'perjalanan-dinas',
  version: '1',
})
export class PerjalananDinasController {
  constructor(private readonly perjalananDinasService: PerjalananDinasService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createDTO: CreatePerjalananDinasDTO) {
    return successResponse(
      PerjalananDinasResource(await this.perjalananDinasService.create(createDTO, req.user.id, req.ip)),
      'success',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Request() req,
  ) {
    return successResponseList(
      await this.perjalananDinasService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
      }, req.user),
      'success',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.perjalananDinasService.findOne({
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
    @Body() updateDTO: UpdatePerjalananDinasDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.perjalananDinasService.update(param.id, updateDTO, req.user, req.ip),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.perjalananDinasService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
