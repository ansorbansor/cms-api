import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Request,
  UseInterceptors,
  UploadedFiles,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { IDParamDto } from 'src/utils/id-param.dto';
import { AbsenceService } from './absence.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CreateAbsenceDTO } from './dto/create-absence.dto';
import { AbsenceResourceDetail } from './resources/absence.resources';
import { ClockOutAbsenceDTO } from './dto/clock-out-absence.dto';

@ApiBearerAuth()
@ApiTags('Absence')
@Controller({
  path: 'absence',
  version: '1',
})
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Request() req,
    @Body() createAbsenceDto: CreateAbsenceDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      AbsenceResourceDetail(
        await this.absenceService.create(
          createAbsenceDto,
          req.user.id,
          req.ip,
          files,
        ),
      ),
      'Terimakasih telah melakukan absen masuk!',
    );
  }

  @Post('clock-out/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async clockOut(
    @Param() param: IDParamDto,
    @Body() clockOutAbsenceDto: ClockOutAbsenceDTO,
    @Request() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.absenceService.clockOut(
        param.id,
        clockOutAbsenceDto,
        req.user,
        req.ip,
        files,
      ),
      'Terimakasih telah melakukan absen keluar!',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('user_id') userId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return successResponseList(
      await this.absenceService.findManyWithPagination({
        page,
        limit,
        total: 0,
        search: search,
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      }),
      'success',
    );
  }

  @Get('has-absence')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async hasAbsenceToday(@Request() req) {
    return successResponse(
      await this.absenceService.hasAbsenceToday(req.user.id),
      'success',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: IDParamDto) {
    return successResponse(
      await this.absenceService.findOne({
        id: +param.id,
      }),
      'success',
    );
  }
}
