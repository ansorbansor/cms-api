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
import { PendingTypeService } from './pending-type.service';
import { CreatePendingTypeDTO } from './dto/create-pending-type.dto';
import { PendingTypeResource } from './resources/pending-type.resources';
import { UpdatePendingTypeDTO } from './dto/update-pending-type.dto';

@ApiBearerAuth()
@ApiTags('Pending Type')
@Controller({
  path: 'pending-type',
  version: '1',
})
export class PendingTypeController {
  constructor(private readonly pendingTypeService: PendingTypeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createPendingTypeDto: CreatePendingTypeDTO,
  ) {
    return successResponse(
      PendingTypeResource(
        await this.pendingTypeService.create(createPendingTypeDto, req.user.id),
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
      await this.pendingTypeService.findManyWithPagination({
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
      await this.pendingTypeService.findOne({
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
    @Body() updatePendingTypeDto: UpdatePendingTypeDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.pendingTypeService.update(
        param.id,
        updatePendingTypeDto,
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
      await this.pendingTypeService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
