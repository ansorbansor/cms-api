import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesService } from 'src/modules/files/files.service';
import { successResponse } from 'src/utils/responses';
import { BufferedFile } from 'src/utils/file-helper';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: BufferedFile, @Request() request) {
    return successResponse(
      await this.filesService.uploadWithMinio(file, request.user.id),
      'success',
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload/profile')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhotoProfile(
    @UploadedFile() file: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.filesService.uploadWithMinio(file, request.user.id),
      'success',
    );
  }

  @Get(':path')
  @ApiParam({ name: 'path', example: 'background.png' })
  async download(@Param('path') path) {
    return successResponse(await this.filesService.getFiles(path), 'success');
  }
}
