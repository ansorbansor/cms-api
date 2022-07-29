import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from 'src/entities/file.entity';
import { User } from 'src/entities/user.entity';
import {
  getFileExtension,
  getFileName,
  getFileType,
} from 'src/utils/file-helper';
import { failedResponse } from 'src/utils/responses';
import { Repository } from 'typeorm';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async uploadFile(file: Express.Multer.File, user: User): Promise<FileEntity> {
    if (!file) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'selectFile');
    }

    const path = {
      local: `/${this.configService.get('app.apiPrefix')}/v1/${file.path}`,
      s3: file.path,
    };

    const fileName = getFileName(file);

    return this.fileRepository.save(
      this.fileRepository.create({
        name: fileName,
        path: path[this.configService.get('file.driver')],
        file_type: getFileType(file.mimetype),
        extension: getFileExtension(file.originalname),
        description: 'user file',
        user: user,
      }),
    );
  }

  async uploadPhotoProfile(
    file: Express.Multer.File,
    user: User,
  ): Promise<FileEntity> {
    if (!file) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'selectFile');
    }

    const path = {
      local: `/${this.configService.get('app.apiPrefix')}/v1/${file.path}`,
      s3: file.path,
    };

    const fileName = getFileName(file);

    const photo = await this.fileRepository.save(
      this.fileRepository.create({
        name: fileName,
        path: path[this.configService.get('file.driver')],
        file_type: getFileType(file.mimetype),
        extension: getFileExtension(file.originalname),
        description: 'user file',
        user: user,
      }),
    );

    await this.userRepository.update(user.id, {
      photo: photo,
    });

    return photo;
  }
}
