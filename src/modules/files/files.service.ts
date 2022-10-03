import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MinioService } from 'nestjs-minio-client';
import minioConfig from 'src/config/minio.config';
import { FileEntity } from 'src/entities/file.entity';
import { User } from 'src/entities/user.entity';
import {
  BufferedFile,
  getFileExtension,
  getFileName,
  getFileType,
  policy,
} from 'src/utils/file-helper';
import { failedResponse } from 'src/utils/responses';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { FileResource } from './resources/file.resources';
import { FileTypeEnum } from 'src/utils/enums';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly minio: MinioService,
  ) {
    this.logger = new Logger('MinioService');
    this.setPolicy();
  }

  private readonly logger: Logger;

  public get client() {
    return this.minio.client;
  }

  private setPolicy() {
    this.client.setBucketPolicy(
      minioConfig().bucketName,
      JSON.stringify(policy(minioConfig())),
      function (err) {
        if (err) throw err;
      },
    );
  }

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

  public async uploadWithMinioBuffer(
    file: any,
    userId: number,
    originalName: string,
  ) {
    const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');
    const extension = originalName.substring(
      originalName.lastIndexOf('.'),
      originalName.length,
    );

    // We need to append the extension at the end otherwise Minio will save it as a generic file
    const fileName = hashedFileName + extension;

    this.client.putObject(minioConfig().bucketName, fileName, file, (error) => {
      if (error) {
        // throw failedResponse(HttpStatus.BAD_REQUEST, 'Error upload file');
        throw new HttpException(
          `Error uploading file ${error}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    });

    return await this.fileRepository.save(
      this.fileRepository.create({
        name: fileName,
        path: `${minioConfig().bucketName}/${fileName}`,
        file_type: FileTypeEnum.image,
        extension: getFileExtension(originalName),
        description: 'user file',
        user_id: userId,
      }),
    );
  }

  public async uploadWithMinio(file: BufferedFile, userId: number) {
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
    const metaData = {
      'Content-Type': file.mimetype,
    };

    // We need to append the extension at the end otherwise Minio will save it as a generic file
    const fileName = hashedFileName + extension;

    this.client.putObject(
      minioConfig().bucketName,
      fileName,
      file.buffer,
      file.size,
      metaData,
      (error) => {
        if (error) {
          // throw failedResponse(HttpStatus.BAD_REQUEST, 'Error upload file');
          throw new HttpException(
            'Error uploading file',
            HttpStatus.BAD_REQUEST,
          );
        }
      },
    );

    return await this.fileRepository.save(
      this.fileRepository.create({
        name: fileName,
        path: `${minioConfig().bucketName}/${fileName}`,
        file_type: getFileType(file.mimetype),
        extension: getFileExtension(file.originalname),
        description: 'user file',
        user_id: userId,
      }),
    );
  }

  async delete(
    objetName: string,
    bucketName: string = minioConfig().bucketName,
  ) {
    this.client.removeObject(bucketName, objetName, (err) => {
      if (err)
        throw new HttpException(
          'An error occured when deleting!',
          HttpStatus.BAD_REQUEST,
        );
    });
  }

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
    file: BufferedFile,
    userId: number,
  ): Promise<FileEntity> {
    if (!file) {
      throw failedResponse(HttpStatus.UNPROCESSABLE_ENTITY, 'selectFile');
    }

    const uploadedFile = await this.uploadWithMinio(file, userId);

    await this.userRepository.update(userId, {
      photo: uploadedFile.id,
    });

    return uploadedFile;
  }
}
