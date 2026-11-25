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
  Patch,
  Put,
  ParseIntPipe,
  Query,
  Res,
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
import { RequestLeaveDTO } from './dto/request-leave.dto';
import { ClarifyUnrecordedDTO } from './dto/clarify-unrecorded.dto';
import { ReviewAbsenceDTO } from './dto/review-absence.dto';
import { UpdateLeaveQuotaDTO } from './dto/update-leave-quota.dto';
import { AbsenceCronService } from './absence.cron.service';

@ApiBearerAuth()
@ApiTags('Absence')
@Controller({
  path: 'absence',
  version: '1',
})
export class AbsenceController {
  constructor(
    private readonly absenceService: AbsenceService,
    private readonly absenceCronService: AbsenceCronService,
  ) {}

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

  @Post('request-leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async requestLeave(
    @Request() req,
    @Body() dto: RequestLeaveDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.absenceService.requestLeave(
        dto,
        req.user.id,
        req.ip,
        files,
      ),
      'Pengajuan berhasil dikirimkan!',
    );
  }

  @Post('clarify-unrecorded')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async clarifyUnrecorded(
    @Request() req,
    @Body() dto: ClarifyUnrecordedDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.absenceService.clarifyUnrecorded(
        dto,
        req.user.id,
        req.ip,
        files,
      ),
      'Klarifikasi hari kosong berhasil dicatat!',
    );
  }

  @Post(':id/upload-evidence')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadEvidence(
    @Param() param: IDParamDto,
    @Request() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return successResponse(
      await this.absenceService.uploadEvidence(
        +param.id,
        req.user.id,
        req.ip,
        files,
      ),
      'Bukti berhasil diunggah!',
    );
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async review(
    @Param() param: IDParamDto,
    @Body() dto: ReviewAbsenceDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.absenceService.reviewAbsence(
        +param.id,
        dto,
        req.user,
        req.ip,
      ),
      dto.action === 'APPROVE'
        ? 'Absensi berhasil disetujui!'
        : 'Bukti absensi ditolak. Deadline perbaikan telah direset.',
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
    @Query('absence_type') absenceType: string,
    @Query('status') status: string,
    @Query('needs_review') needsReview: string,
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
        absence_type: absenceType,
        status: status,
        needs_review: needsReview === 'true' || needsReview === '1',
      }),
      'success',
    );
  }

  @Get('monthly-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getMonthlySummary(
    @Query('month') month: string,
    @Query('until') until?: string,
  ) {
    return successResponse(
      await this.absenceService.getMonthlySummary(month, until),
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

  @Get('unrecorded-days')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUnrecordedDays(@Request() req) {
    return successResponse(
      await this.absenceService.getUnrecordedDays(req.user.id),
      'success',
    );
  }

  @Get('my-tasks')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyTasks(@Request() req) {
    return successResponse(
      await this.absenceService.getMyTasks(req.user.id),
      'success',
    );
  }

  @Get('leave-quota')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyLeaveQuota(
    @Request() req,
    @Query('year') year?: number,
  ) {
    return successResponse(
      await this.absenceService.getLeaveQuota(req.user.id, year),
      'success',
    );
  }

  @Get('leave-quotas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getLeaveQuotas(
    @Query('year') year?: number,
    @Query('search') search?: string,
  ) {
    return successResponse(
      await this.absenceService.getLeaveQuotas(year, search),
      'success',
    );
  }

  @Put('leave-quotas/:userId/:year')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updateLeaveQuota(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('year', ParseIntPipe) year: number,
    @Body() dto: UpdateLeaveQuotaDTO,
    @Request() req,
  ) {
    return successResponse(
      await this.absenceService.updateLeaveQuota(
        userId,
        year,
        dto,
        req.user,
        req.ip,
      ),
      'Kuota cuti berhasil diperbarui!',
    );
  }

  @Post('trigger-reminder')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async triggerReminder() {
    await this.absenceCronService.handleDailyAbsenceReminder();
    return successResponse(null, 'Reminder triggered successfully');
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

  @Post('machine-event')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async handleMachineEvent(
    @Request() req,
    @Body() body,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res,
  ) {
    return this.absenceService.processMachineEvent(req, body, files, res);
  }
}
