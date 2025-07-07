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
  UploadedFile,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { UsersService } from 'src/modules/users/users.service';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { successResponse, successResponseList } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { UserResource } from './resources/user.resources';
import { IDParamDto } from 'src/utils/id-param.dto';
import { MenuPermission } from 'src/utils/enums';
import { Menus } from 'src/utils/decorator';

@ApiBearerAuth()
@ApiTags('Users')
@Controller({
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @Menus(MenuPermission.USER_CREATE)
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Request() req,
    @Body() createProfileDto: CreateUserDto,
    @UploadedFile() file?: BufferedFile,
  ) {
    return successResponse(
      UserResource(
        await this.usersService.create(
          createProfileDto,
          req.user.id,
          file,
          req.ip,
        ),
      ),
      'success',
    );
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('position_id') positionId: number,
  ) {
    return successResponseList(
      await this.usersService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        employeePosition: positionId,
      }),
      'success',
    );
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.usersService.findOne({
        id: +param.id,
      }),
      'success',
    );
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Menus(MenuPermission.USER_CREATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param() param: IDParamDto,
    @Body() updateProfileDto: UpdateUserDto,
    @Request() req,
    @UploadedFile() photo?: BufferedFile,
  ) {
    return successResponse(
      await this.usersService.update(
        param.id,
        updateProfileDto,
        req.user,
        req.ip,
        photo,
      ),
      'success',
    );
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Menus(MenuPermission.USER_CREATE)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.usersService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }
}
