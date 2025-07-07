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
import { BiddingAreaService } from './bidding-area.service';
import { CreateBiddingAreaDTO } from './dto/create-bidding-area.dto';
import { BiddingAreaResource } from './resources/bidding-area.resources';
import { UpdateBiddingAreaDTO } from './dto/update-bidding-area.dto';

@ApiBearerAuth()
@ApiTags('Bidding Area')
@Controller({
  path: 'bidding-area',
  version: '1',
})
export class BiddingAreaController {
  constructor(private readonly biddingAreaService: BiddingAreaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createBiddingAreaDto: CreateBiddingAreaDTO,
  ) {
    return successResponse(
      BiddingAreaResource(
        await this.biddingAreaService.create(createBiddingAreaDto, req.user.id),
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
      await this.biddingAreaService.findManyWithPagination({
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
      await this.biddingAreaService.findOne({
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
    @Body() updateBiddingAreaDTO: UpdateBiddingAreaDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.biddingAreaService.update(
        param.id,
        updateBiddingAreaDTO,
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
      await this.biddingAreaService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
