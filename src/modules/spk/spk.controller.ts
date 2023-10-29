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
import { SPKService } from './spk.service';
import { CreateSPKDTO } from './dto/create.spk.dto';
import { UpdateSPKDTO } from './dto/update-spk.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Menus } from 'src/utils/decorator';
import { MenuPermission } from 'src/utils/enums';
import { UpdateSPKSettlementDTO } from './dto/update-spk-settlement.dto';
import { SPKResourceDetail } from './resources/spk.resources';

@ApiBearerAuth()
@ApiTags('SPK')
@Controller({
  path: 'spk',
  version: '1',
})
export class SPKController {
  constructor(private readonly spkService: SPKService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @Menus(MenuPermission.SPK_CREATE)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Request() req,
    @Body() createSPKDto: CreateSPKDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      SPKResourceDetail(
        await this.spkService.create(createSPKDto, req.user.id, req.ip, files),
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
    @Body() updateSPKDto: UpdateSPKDTO,
    @Request() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.spkService.update(
        param.id,
        updateSPKDto,
        req.user,
        req.ip,
        files,
      ),
      'success',
    );
  }

  @Post('cico/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async updateCICOPhoto(
    @Request() req,
    @Param() param: IDParamDto,
    @Body('total_range') totalRange: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.spkService.updateCICOPhoto(
        param.id,
        req.user,
        req.ip,
        totalRange,
        files,
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
    @Body() updateSPKSettlementDTO: UpdateSPKSettlementDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.spkService.updateSettlement(
        param.id,
        updateSPKSettlementDTO,
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
      await this.spkService.updateCostEvidence(
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
  ) {
    return successResponseList(
      await this.spkService.findManyWithPagination(
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
      ),
      'success',
    );
  }

  @Get('category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getAllSPKCategory(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('status') status: number,
  ) {
    return successResponseList(
      await this.spkService.getAllSPKCategory({
        page,
        limit,
        total: 0,
        search: search,
        start_date: startDate,
        end_date: endDate,
        status: status,
      }),
      'success',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.spkService.findOne({
        id: +param.id,
      }),
      'success',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param() param: IDParamDto, @Request() req) {
    return successResponse(
      await this.spkService.softDelete(param.id, req.user, req.ip),
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
      await this.spkService.approveOverBudget(param.id, req.user, remark),
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
      await this.spkService.approve(param.id, req.user, remark),
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
      await this.spkService.reject(param.id, req.user, remark),
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
      await this.spkService.rejectOverBudget(param.id, req.user, remark),
      'BOP Berhasil Direject',
    );
  }
}
