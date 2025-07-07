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
import { OperatorService } from './operator.service';
import { CreateOperatorDTO } from './dto/create-operator.dto';
import { OperatorResource } from './resources/operator.resources';
import { UpdateOperatorDTO } from './dto/update-operator.dto';

@ApiBearerAuth()
@ApiTags('Operator')
@Controller({
  path: 'operator',
  version: '1',
})
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createOperatorDto: CreateOperatorDTO) {
    return successResponse(
      OperatorResource(
        await this.operatorService.create(createOperatorDto, req.user.id),
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
      await this.operatorService.findManyWithPagination({
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
      await this.operatorService.findOne({
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
    @Body() updateOperatorDto: UpdateOperatorDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.operatorService.update(
        param.id,
        updateOperatorDto,
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
      await this.operatorService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
