import * as crypto from 'crypto';
import { FileTypeEnum } from './enums';

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
  else fileType = FileTypeEnum.document; // fallback: treat all unrecognized types as document
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

// Minio
export interface BufferedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: AppMimeType;
  size: number;
  buffer: Buffer | string;
  path: string;
}

export interface StoredFile extends HasFile, StoredFileMetadata {}

export interface HasFile {
  file: Buffer | string;
}

export interface StoredFileMetadata {
  id: string;
  name: string;
  encoding: string;
  mimetype: AppMimeType;
  size: number;
  updatedAt: Date;
  fileSrc?: string;
}

export type AppMimeType = 'image/png' | 'image/jpeg';

export function policy(minioConfig) {
  return {
    Version: process.env.MINIO_BUCKET_VERSION,
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          AWS: ['*'],
        },
        Action: [
          's3:ListBucketMultipartUploads',
          's3:GetBucketLocation',
          's3:ListBucket',
        ],
        Resource: [`arn:aws:s3:::${minioConfig.bucketName}`], // Change this according to your bucket name
      },
      {
        Effect: 'Allow',
        Principal: {
          AWS: ['*'],
        },
        Action: [
          's3:PutObject',
          's3:AbortMultipartUpload',
          's3:DeleteObject',
          's3:GetObject',
          's3:ListMultipartUploadParts',
        ],
        Resource: [`arn:aws:s3:::${minioConfig.bucketName}/*`], // Change this according to your bucket name
      },
      {
        Sid: 'PublicRead',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject', 's3:GetObjectVersion'],
        Resource: [`arn:aws:s3:::${minioConfig.bucketName}/*`], // Change this according to your bucket name
      },
    ],
  };
}
