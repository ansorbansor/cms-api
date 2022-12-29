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
import { StatusAcceptanceService } from './status-acceptance.service';
import { CreateStatusAcceptanceDTO } from './dto/create-status-acceptance.dto';
import { UpdateStatusAcceptanceDTO } from './dto/update-status-acceptance.dto';
import { StatusAcceptanceResource } from './resources/status-acceptance.resources';

@ApiBearerAuth()
@ApiTags('Status Acceptance')
@Controller({
  path: 'status-acceptance',
  version: '1',
})
export class StatusAcceptanceController {
  constructor(
    private readonly statusAcceptanceService: StatusAcceptanceService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createStatusAcceptanceDto: CreateStatusAcceptanceDTO,
  ) {
    return successResponse(
      StatusAcceptanceResource(
        await this.statusAcceptanceService.create(
          createStatusAcceptanceDto,
          req.user.id,
        ),
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
      await this.statusAcceptanceService.findManyWithPagination({
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
      await this.statusAcceptanceService.findOne({
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
    @Body() updateStatusAcceptanceDto: UpdateStatusAcceptanceDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.statusAcceptanceService.update(
        param.id,
        updateStatusAcceptanceDto,
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
      await this.statusAcceptanceService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
