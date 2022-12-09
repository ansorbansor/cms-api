import {
  Controller,
  Delete,
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
import { FilesService } from 'src/modules/files/files.service';
import { successResponse } from 'src/utils/responses';
import { BufferedFile } from 'src/utils/file-helper';
import { FilePath } from 'src/utils/enums';
import { JwtAuthGuard } from 'src/utils/guards';
import { IDParamDto } from 'src/utils/id-param.dto';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: BufferedFile, @Request() request) {
    return successResponse(
      await this.filesService.uploadWithMinio(
        file,
        request.user.id,
        FilePath.OTHER,
        'Other Files',
      ),
      'success',
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload/profile')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhotoProfile(
    @UploadedFile() file: BufferedFile,
    @Request() request,
  ) {
    return successResponse(
      await this.filesService.uploadWithMinio(
        file,
        request.user.id,
        FilePath.USER,
        'Other Files',
      ),
      'success',
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('upload-from-local')
  async uploadPhotoProfilee() {
    return successResponse(
      await this.filesService.uploadCourseImageToMinioFromLocal(),
      'success',
    );
  }

  @Get(':path')
  @ApiParam({ name: 'path', example: 'background.png' })
  async download(@Param('path') path) {
    return successResponse(await this.filesService.getFiles(path), 'success');
  }

  @Delete('delete-unused')
  async deleteUnused() {
    return successResponse(await this.filesService.deleteUnused(), 'success');
  }

  @Delete(':id')
  @ApiParam({ name: 'id', example: '1' })
  async delete(@Param() param: IDParamDto) {
    return successResponse(await this.filesService.delete(param.id), 'success');
  }
}
