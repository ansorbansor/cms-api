import { Controller, All, Request, Body, UploadedFiles, Res, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AbsenceService } from './modules/absence/absence.service';

@Controller()
export class AppController {
  constructor(private readonly absenceService: AbsenceService) {}

  @All('/')
  @UseInterceptors(AnyFilesInterceptor())
  async handleRoot(
    @Request() req,
    @Body() body,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res,
  ) {
    if (req.method === 'POST') {
      return this.absenceService.processMachineEvent(req, body, files, res);
    }
    return res.status(200).send('SIMPRO Backend API is Running');
  }

  @All('iot/*')
  async handleIot(@Request() req, @Res() res) {
    return this.absenceService.sendHikvisionAck(req, res);
  }
}

