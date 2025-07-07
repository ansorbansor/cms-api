import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
  Response,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilesService } from 'src/modules/files/files.service';
import { AuthGuard } from '@nestjs/passport';
import { FilePath } from 'src/utils/enums';

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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file, @Request() request) {
    return this.filesService.uploadFile(
      file,
      request.user.id,
      FilePath.USER,
      'Other Files',
    );
  }

  @Get(':path')
  @ApiParam({ name: 'path', example: 'background.png' })
  async download(@Param('path') path, @Response() response) {
    return response.sendFile(path, { root: './files' });
  }
}
