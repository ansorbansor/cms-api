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
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IDParamDto } from 'src/utils/id-param.dto';

@ApiBearerAuth()
@ApiTags('Role')
@Controller({
  path: 'role',
  version: '1',
})
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto, @Request() req) {
    return successResponse(
      await this.roleService.create(createRoleDto, req.user, req.ip),
      'success',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
  ) {
    return successResponseList(
      await this.roleService.findManyWithPagination({
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
      await this.roleService.findOne({ id: +param.id }),
      'success',
    );
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateRoleDto: UpdateRoleDto, @Request() req) {
    return successResponse(
      await this.roleService.update(updateRoleDto, req.user, req.ip),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.roleService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
