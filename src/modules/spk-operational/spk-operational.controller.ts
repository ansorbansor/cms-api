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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { IDParamDto } from 'src/utils/id-param.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Menus } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { SPKOperationalService } from './spk-operational.service';
import { CreateSPKOperationalDTO } from './dto/create.spk-operational.dto';
import { SPKOperationalResourceDetail } from './resources/spk-operational.resources';
import { UpdateSPKOperationalDTO } from './dto/update-spk-operational.dto';
import { UpdateSPKOperationalSettlementDTO } from './dto/update-spk-operational-settlement.dto';

@ApiBearerAuth()
@ApiTags('SPK')
@Controller({
  path: 'spk-operational',
  version: '1',
})
export class SPKOperationalController {
  constructor(private readonly spkOperationalService: SPKOperationalService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @Menus(MenuPermission.SPK_CREATE)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Request() req,
    @Body() createSPKOperationalDto: CreateSPKOperationalDTO,
  ) {
    return successResponse(
      SPKOperationalResourceDetail(
        await this.spkOperationalService.create(
          createSPKOperationalDto,
          req.user.id,
          req.ip,
        ),
      ),
      'success',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @Menus(MenuPermission.SPK_CREATE)
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param() param: IDParamDto,
    @Body() updateSPKOperationalDto: UpdateSPKOperationalDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.spkOperationalService.update(
        param.id,
        updateSPKOperationalDto,
        req.user,
        req.ip,
      ),
      'success',
    );
  }

  @Post('settlement/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @Menus(
    MenuPermission.SPK_KASBON_SETTLEMENT,
    MenuPermission.SPK_KASBON_SETTLEMENT_CLOSE,
  )
  @UseInterceptors(AnyFilesInterceptor())
  async updateSettlement(
    @Request() req,
    @Param() param: IDParamDto,
    @Body()
    updateSPKOperationalSettlementDTO: UpdateSPKOperationalSettlementDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.spkOperationalService.updateSettlement(
        param.id,
        updateSPKOperationalSettlementDTO,
        req.user,
        req.ip,
        files,
      ),
      'success',
    );
  }

  @Post('cost-evidence/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async updateCostEvidence(
    @Request() req,
    @Param() param: IDParamDto,
    @Body('id') id: number[],
    @Body('name') name: string[],
    @Body('cost') cost: number[],
    @Body('deleted_id') deletedId: number[],
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.spkOperationalService.updateCostEvidence(
        param.id,
        req.user,
        req.ip,
        id,
        name,
        cost,
        files,
        deletedId,
      ),
      'success',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('status') status: number,
    @Query('mobile') mobile: boolean,
  ) {
    return successResponseList(
      await this.spkOperationalService.findManyWithPagination(
        {
          page,
          limit,
          total: 0,
          search: search,
          start_date: startDate,
          end_date: endDate,
          status: status,
        },
        req.user,
        mobile,
      ),
      'success',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.spkOperationalService.findOne(
        {
          id: +param.id,
        },
        req.user,
      ),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.spkOperationalService.softDelete(param.id, req.user, req.ip),
      'success',
    );
  }

  @Get('approve-over-budget/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Menus(MenuPermission.SPK_OVER_BUDGET)
  async approveOverBudget(
    @Param() param: IDParamDto,
    @Request() req,
    @Query('remark') remark: string,
  ) {
    return successResponse(
      await this.spkOperationalService.approveOverBudget(
        param.id,
        req.user,
        remark,
      ),
      'success',
    );
  }

  @Get('approve/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Menus(MenuPermission.SPK_APPROVE)
  async approve(
    @Param() param: IDParamDto,
    @Request() req,
    @Query('remark') remark: string,
  ) {
    return successResponse(
      await this.spkOperationalService.approve(param.id, req.user, remark),
      'success',
    );
  }

  @Get('reject/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Menus(MenuPermission.SPK_APPROVE)
  async reject(
    @Param() param: IDParamDto,
    @Request() req,
    @Query('remark') remark: string,
  ) {
    return successResponse(
      await this.spkOperationalService.reject(param.id, req.user, remark),
      'BOP Berhasil Direject',
    );
  }

  @Get('reject-over-budget/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Menus(MenuPermission.SPK_OVER_BUDGET)
  async rejectOverBudget(
    @Param() param: IDParamDto,
    @Request() req,
    @Query('remark') remark: string,
  ) {
    return successResponse(
      await this.spkOperationalService.rejectOverBudget(
        param.id,
        req.user,
        remark,
      ),
      'BOP Berhasil Direject',
    );
  }
}
