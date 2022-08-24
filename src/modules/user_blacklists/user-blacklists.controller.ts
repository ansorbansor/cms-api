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
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { UsersService } from 'src/modules/users/users.service';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { MenuPermission } from 'src/utils/enums';
import { UpdateBlacklistUserDto } from './dto/update-blacklist-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.usersService.findManyWithPagination({
        page,
        limit,
        total: 0,
        blacklist: true,
      }),
      'success',
    );
  }

  @Get('blacklist/users/:id')
  @Permissions(MenuPermission.READ)
  @Controllers(BlacklistController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.usersService.findOne({
        id: +id,
        blacklist: true,
      }),
      'success',
    );
  }

  @Patch('blacklist/users/:id')
  @Permissions(MenuPermission.UPDATE)
  @Controllers(BlacklistController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: number,
    @Body() updateBlacklistUserDto: UpdateBlacklistUserDto,
    @UploadedFile() photo?: BufferedFile,
  ) {
    const updateProfileDto = new UpdateUserDto();
    updateProfileDto.blacklist = updateBlacklistUserDto.blacklist;

    return successResponse(
      await this.usersService.update(id, updateProfileDto, photo),
      'success',
    );
  }
}
