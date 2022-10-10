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
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { MenuPermission } from 'src/utils/enums';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiBearerAuth()
@ApiTags('Role')
@Controller({
  path: 'role',
  version: '1',
})
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions(MenuPermission.CREATE)
  @Controllers(RoleController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto, @Request() req) {
    return successResponse(
      await this.roleService.create(createRoleDto, req.user, req.ip),
      'success',
    );
  }

  @Get()
  @Permissions(MenuPermission.READ)
  @Controllers(RoleController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    if (limit > 50) {
      limit = 50;
    }

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
  @Permissions(MenuPermission.READ)
  @Controllers(RoleController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.roleService.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Permissions(MenuPermission.UPDATE)
  @Controllers(RoleController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateRoleDto: UpdateRoleDto, @Request() req) {
    return successResponse(
      await this.roleService.update(updateRoleDto, req.user, req.ip),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(RoleController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(await this.roleService.softDelete(id), 'success');
  }
}
