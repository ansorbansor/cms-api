import { HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import multerConfig from 'src/config/multer.config';
import { FileTypeEnum, MaxFileSize } from './enums';
import { v4 as uuid } from 'uuid';

export const multerOptions = {
  fileFilter: (req: any, file: any, cb: any) => {
    // Check the mimetypes and file size to allow for upload
    const fileType = getFileType(file.mimetype);

    if (fileType) {
      const fileSize = parseInt(req.headers['content-length']) / 1000;

      if (fileType == FileTypeEnum.image && fileSize <= MaxFileSize.IMAGE) {
        cb(null, true);
      } else {
        // Reject file
        cb(
          new HttpException(
            `Unsupported file type ${extname(file.originalname)}`,
            HttpStatus.BAD_REQUEST,
          ),
          false,
        );
      }
    } else {
      // Reject file
      cb(
        new HttpException(
          `Unsupported file types ${extname(file.originalname)}`,
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }
  },
  // Storage properties
  storage: diskStorage({
    // Destination storage path details
    destination: (req: any, file: any, cb: any) => {
      const uploadPath = multerConfig().destination;
      // Create folder if doesn't exist
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    // File modification details
    filename: (req: any, file: any, cb: any) => {
      // Calling the callback passing the random name generated with the original extension name
      cb(null, `${uuid()}${extname(file.originalname)}`);
    },
  }),
};

export const getFileExtension = (fileName: string): string => {
  const split = fileName.split('.');
  return split[split.length - 1];
};

export const getFileType = (mimes: string): number => {
  let fileType = null;
  if (mimes.match('image/*')) fileType = FileTypeEnum.image;
  else if (mimes.match('video/*')) fileType = FileTypeEnum.video;
  else if (mimes.match('audio/*')) fileType = FileTypeEnum.audio;
  else if (mimes === 'application/pdf') fileType = FileTypeEnum.document;
  else if (mimes === 'application/msword,') fileType = FileTypeEnum.document;
  else if (mimes === 'application/vnd.ms-word.document.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  else if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document,'
  )
    fileType = FileTypeEnum.document;
  else if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template,'
  )
    fileType = FileTypeEnum.document;
  else if (mimes === 'application/vnd.ms-word.template.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  else if (mimes === 'text/html,') fileType = FileTypeEnum.document;
  else if (mimes === 'application/pdf,') fileType = FileTypeEnum.document;
  else if (mimes === 'application/vnd.ms-powerpoint.template.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  else if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.template,'
  )
    fileType = FileTypeEnum.document;
  else if (mimes === 'application/vnd.ms-powerpoint.addin.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  else if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow,'
  )
    fileType = FileTypeEnum.document;
  else if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow,'
  )
    fileType = FileTypeEnum.document;
  else if (mimes === 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  else if (mimes === 'application/vnd.ms-powerpoint,')
    fileType = FileTypeEnum.document;
  else if (
    mimes === 'application/vnd.ms-powerpoint.presentation.macroEnabled.12,'
  )
    fileType = FileTypeEnum.document;
  else if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.presentation,'
  )
    fileType = FileTypeEnum.document;
  else if (mimes === 'application/rtf,') fileType = FileTypeEnum.document;
  else if (mimes === 'text/rtf,') fileType = FileTypeEnum.document;
  else if (mimes === 'text/plain,') fileType = FileTypeEnum.document;
  return fileType;
};

export const getFileName = (
  file: Express.Multer.File,
  userId?: number,
): string => {
  let name: string;
  const extension = getFileExtension(file.originalname);
  const dateTime = new Date().getMilliseconds();
  if (userId) {
    name = userId.toString() + dateTime;
  } else {
    name = dateTime.toString();
  }
  const rand = crypto.createHash('md5').update(name).digest('hex');
  const fileName = rand + '.' + extension;
  return fileName;
};
