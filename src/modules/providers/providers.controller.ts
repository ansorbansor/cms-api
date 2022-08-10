import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { RoleEnum } from 'src/utils/enums';
import { Roles } from 'src/utils/decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/utils/file-helper';
import { successResponse, successResponseList } from 'src/utils/responses';

@ApiBearerAuth()
@ApiTags('Providers')
@Controller({
  path: 'providers',
  version: '1',
})
export class ProvidersController {
  constructor(private readonly providerServices: ProvidersService) {}

  @Post()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  create(
    @Body() createProviderDto: CreateProviderDto,
    @UploadedFile() photo: Express.Multer.File,
    @Request() request,
  ) {
    return successResponse(
      this.providerServices.create(createProviderDto, photo, request.user),
      'success',
    );
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.user)
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
      await this.providerServices.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return successResponse(
      this.providerServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  update(
    @Body() updateProviderDto: UpdateProviderDto,
    @UploadedFile() photo: Express.Multer.File,
    @Request() request,
  ) {
    return successResponse(
      this.providerServices.update(updateProviderDto, photo, request.user),
      'success',
    );
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: number) {
    return successResponse(this.providerServices.softDelete(id), 'success');
  }
}
