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
  ParseArrayPipe,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { UsersService } from 'src/modules/users/users.service';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { CreateUserTopicDto } from './dto/create-user-topic.dto';
import { MenuPermission } from 'src/utils/enums';

@ApiBearerAuth()
@ApiTags('Users')
@Controller({
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users')
  @Permissions(MenuPermission.CREATE)
  @Controllers(UsersController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Request() req,
    @Body() createProfileDto: CreateUserDto,
    @UploadedFile() file?: BufferedFile,
  ) {
    return successResponse(
      await this.usersService.create(
        createProfileDto,
        req.user.id,
        file,
        req.ip,
      ),
      'success',
    );
  }

  @Get('users')
  @Permissions(MenuPermission.READ)
  @Controllers(UsersController.name)
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
        search: search,
        employeePosition: positionId,
        employeeUnit: unitId,
        employeeLevel: levelId,
        role: roleId,
      }),
      'success',
    );
  }

  @Get('users/:id')
  @Permissions(MenuPermission.READ)
  @Controllers(UsersController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.usersService.findOne({
        id: +id,
      }),
      'success',
    );
  }

  @Patch('users/:id')
  @Permissions(MenuPermission.UPDATE)
  @Controllers(UsersController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: number,
    @Body() updateProfileDto: UpdateUserDto,
    @Request() req,
    @UploadedFile() photo?: BufferedFile,
  ) {
    return successResponse(
      await this.usersService.update(
        id,
        updateProfileDto,
        req.user,
        req.ip,
        photo,
      ),
      'success',
    );
  }

  @Delete('users/:id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(UsersController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number, @Request() req) {
    return successResponse(
      await this.usersService.softDelete(id, req.user, req.ip),
      'success',
    );
  }

  @Post('user/topics')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUserTopic(
    @Body(new ParseArrayPipe({ items: CreateUserTopicDto, whitelist: true }))
    createUserTopicDto: CreateUserTopicDto[],
    @Request() request,
  ) {
    return successResponse(
      await this.usersService.createUserTopic(
        createUserTopicDto,
        request.user.id,
      ),
      'success',
    );
  }
}
