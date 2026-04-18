import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { Roles } from 'src/utils/decorator';
import { IDParamDto } from 'src/utils/id-param.dto';
import { TransportationService } from './transportation.service';
import { CreateTransportationDto } from './dto/create-transportation.dto';
import { TransportationResource } from './resources/transportation.resources';

@ApiBearerAuth()
@ApiTags('Transportation')
@Controller({
  path: 'transportation',
  version: '1',
})
export class TransportationController {
  constructor(private readonly transportationService: TransportationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(8)
  @HttpCode(HttpStatus.OK)
  async create(@Body() createDto: CreateTransportationDto) {
    return successResponse(
      TransportationResource(
        await this.transportationService.create(createDto)
      ),
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
  ) {
    return successResponseList(
      await this.transportationService.findManyWithPagination({
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
      await this.transportationService.findOne({
        id: +param.id,
      }),
      'success',
    );
  }
}
