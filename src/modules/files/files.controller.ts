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
  constructor(private readonly filesService: FilesService) { }

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
  async download(@Param('path') pathParam, @Response() response) {
    let targetPath = pathParam;

    let rootDir = './files';
    try {
      const fs = require('fs');
      const pathMod = require('path');
      let physicalPath = pathMod.join(process.cwd(), 'files', pathParam);

      if (!fs.existsSync(physicalPath)) {
        const uploadPath = pathMod.join(process.cwd(), 'uploads', pathParam);
        if (fs.existsSync(uploadPath)) {
          rootDir = './uploads';
          physicalPath = uploadPath;
        }
      }

      if (!fs.existsSync(physicalPath)) {
        const fileRecord = await this.filesService.getFiles(pathParam);
        if (fileRecord && fileRecord.path) {
          const actualName = fileRecord.path.split('/').pop();
          if (actualName) targetPath = actualName;
        }
      }
    } catch (e) {
      // Ignore if not found in DB
    }

    response.sendFile(targetPath, { root: rootDir }, (err) => {
      if (err) {
        if (!response.headersSent) {
          response.status(404).send('File not found');
        }
      }
    });
  }
}
