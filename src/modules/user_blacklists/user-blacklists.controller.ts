import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
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
import { UsersService } from 'src/modules/users/users.service';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenuPermission } from 'src/utils/enums';
import { UpdateBlacklistUserDto } from './dto/update-blacklist-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { IDParamDto } from 'src/utils/id-param.dto';

@ApiBearerAuth()
@ApiTags('Users')
@Controller({
  version: '1',
})
export class BlacklistController {
  constructor(private readonly usersService: UsersService) {}

  @Get('blacklist/users')
  @Permissions(MenuPermission.READ)
  @Controllers(BlacklistController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('position_id') positionId: number,
    @Query('unit_id') unitId: number,
    @Query('level_id') levelId: number,
    @Query('role_id') roleId: number[],
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.usersService.findManyWithPagination({
        page,
        limit,
        total: 0,
        blacklist: 'true',
        search: search,
        employeePosition: positionId,
        employeeUnit: unitId,
        employeeLevel: levelId,
        role: roleId,
      }),
      'success',
    );
  }

  @Get('blacklist/users/:id')
  @Permissions(MenuPermission.READ)
  @Controllers(BlacklistController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.usersService.findOne({
        id: +param.id,
        blacklist: true,
      }),
      'success',
    );
  }

  @Patch('blacklist/users/:id')
  @Permissions(MenuPermission.UPDATE)
  @Controllers(BlacklistController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param() param: IDParamDto,
    @Body() updateBlacklistUserDto: UpdateBlacklistUserDto,
    @Request() req,
  ) {
    const updateProfileDto = new UpdateUserDto();
    updateProfileDto.blacklist = updateBlacklistUserDto.blacklist;

    return successResponse(
      await this.usersService.updateBlacklist(
        param.id,
        updateProfileDto.blacklist,
        req.user,
        req.ip,
      ),
      'success',
    );
  }
}
