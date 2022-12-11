import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from 'src/entities/file.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { FileResource } from './resources/file.resources';
import * as crypto from 'crypto';
import { getFileType, getFileExtension } from 'src/utils/file-helper';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  public async getFiles(name: string) {
    const getFile = await this.fileRepository.findOne({
      where: {
        name: name,
      },
    });

    if (!getFile) {
      throw new HttpException('File tidak ditemukan', HttpStatus.BAD_REQUEST);
    }

    return FileResource(getFile);
  }

  async uploadFile(
    file,
    userId: number,
    path: string,
    description: string,
  ): Promise<FileEntity> {
    if (!file) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'selectFile',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
      throw new HttpException(
        'File type not supported',
        HttpStatus.BAD_REQUEST,
      );
    }
    const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');
    const extension = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length,
    );

    // We need to append the extension at the end otherwise Minio will save it as a generic file
    const fileName = hashedFileName + extension;

    return await this.fileRepository.save(
      this.fileRepository.create({
        name: fileName,
        path: `${path}/${fileName}`,
        file_type: getFileType(file.mimetype),
        extension: getFileExtension(file.originalname),
        description: description,
        user_id: userId,
      }),
    );
  }
}
