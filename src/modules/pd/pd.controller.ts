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
import { PDService } from './pd.service';
import { CreatePDDTO } from './dto/create-pd.dto';
import { PDResource } from './resources/pd.resources';
import { UpdatePDDTO } from './dto/update-pd.dto';

@ApiBearerAuth()
@ApiTags('PD')
@Controller({
  path: 'pd',
  version: '1',
})
export class PDController {
  constructor(private readonly pdService: PDService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createPDDto: CreatePDDTO) {
    return successResponse(
      PDResource(await this.pdService.create(createPDDto, req.user.id)),
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
      await this.pdService.findManyWithPagination({
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
      await this.pdService.findOne({
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
    @Body() updatePDDto: UpdatePDDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.pdService.update(param.id, updatePDDto, req.user, req.ip),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.pdService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
