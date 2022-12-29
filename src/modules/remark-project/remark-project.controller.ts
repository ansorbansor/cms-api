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
import { RemarkProjectService } from './remark-project.service';
import { CreateRemarkProjectDTO } from './dto/create-remark-project.dto';
import { RemarkProjectResource } from './resources/remark-project.resources';
import { UpdateRemarkProjectDTO } from './dto/update-remark-project.dto';

@ApiBearerAuth()
@ApiTags('Remark Project')
@Controller({
  path: 'remark-project',
  version: '1',
})
export class RemarkProjectController {
  constructor(private readonly remarkProjectService: RemarkProjectService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createRemarkProjectDto: CreateRemarkProjectDTO,
  ) {
    return successResponse(
      RemarkProjectResource(
        await this.remarkProjectService.create(
          createRemarkProjectDto,
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
      await this.remarkProjectService.findManyWithPagination({
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
      await this.remarkProjectService.findOne({
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
    @Body() updateRemarkProjectDto: UpdateRemarkProjectDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.remarkProjectService.update(
        param.id,
        updateRemarkProjectDto,
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
      await this.remarkProjectService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
