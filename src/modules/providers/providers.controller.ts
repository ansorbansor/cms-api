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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { RoleEnum } from 'src/utils/enums';
import { Roles } from 'src/utils/decorator';

@ApiBearerAuth()
@ApiTags('Providers')
@Controller({
  path: 'providers',
  version: '1',
})
export class ProvidersController {
  constructor(private readonly providerServices: ProvidersService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProfileDto: CreateProviderDto) {
    return this.providerServices.create(createProfileDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return this.providerServices.findManyWithPagination({
      page,
      limit,
      total: 0,
    });
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.providerServices.findOne({ id: +id });
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: number, @Body() updateProfileDto: UpdateProviderDto) {
    return this.providerServices.update(id, updateProfileDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: number) {
    return this.providerServices.softDelete(id);
  }
}
