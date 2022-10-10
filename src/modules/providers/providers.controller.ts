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
import { MenuPermission } from 'src/utils/enums';
import { Controllers, Permissions } from 'src/utils/decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { successResponse, successResponseList } from 'src/utils/responses';

@ApiBearerAuth()
@ApiTags('Providers')
@Controller({
  path: 'providers',
  version: '1',
})
export class ProvidersController {
  constructor(private readonly providerServices: ProvidersService) {}

  @Get('register/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async sendMailRegisterProvider(
    @Param('id') providerId: number,
    @Request() request,
  ) {
    return successResponse(
      await this.providerServices.sendMailRegisterProvider(
        providerId,
        request.user.id,
      ),
      'Berhasil mengirim email',
    );
  }

  @Post()
  @Permissions(MenuPermission.CREATE)
  @Controllers(ProvidersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createProviderDto: CreateProviderDto,
    @UploadedFile() photo: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.providerServices.create(
        createProviderDto,
        photo,
        request.user,
        request.ip,
      ),
      'success',
    );
  }

  @Get()
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
      await this.providerServices.findManyWithPagination({
        page,
        limit,
        total: 0,
        search,
      }),
      'success',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.providerServices.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Permissions(MenuPermission.UPDATE)
  @Controllers(ProvidersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Body() updateProviderDto: UpdateProviderDto,
    @UploadedFile() photo: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.providerServices.update(
        updateProviderDto,
        photo,
        request.user,
        request.ip,
      ),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(ProvidersController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number, @Request() request) {
    return successResponse(
      await this.providerServices.softDelete(id, request.user, request.ip),
      'success',
    );
  }
}
