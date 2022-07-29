import * as crypto from 'crypto';
import { FileTypeEnum } from './enums';

export const getFileExtension = (fileName: string): string => {
  const split = fileName.split('.');
  return split[split.length - 1];
};

export const getFileType = (mimes: string): number => {
  let fileType = 1;
  if (mimes.match('image/*')) fileType = FileTypeEnum.image;
  if (mimes.match('video/*')) fileType = FileTypeEnum.video;
  if (mimes.match('audio/*')) fileType = FileTypeEnum.audio;
  if (mimes === 'application/pdf') fileType = FileTypeEnum.document;
  if (mimes === 'application/msword,') fileType = FileTypeEnum.document;
  if (mimes === 'application/vnd.ms-word.document.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document,'
  )
    fileType = FileTypeEnum.document;
  if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template,'
  )
    fileType = FileTypeEnum.document;
  if (mimes === 'application/vnd.ms-word.template.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  if (mimes === 'text/html,') fileType = FileTypeEnum.document;
  if (mimes === 'application/pdf,') fileType = FileTypeEnum.document;
  if (mimes === 'application/vnd.ms-powerpoint.template.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.template,'
  )
    fileType = FileTypeEnum.document;
  if (mimes === 'application/vnd.ms-powerpoint.addin.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow,'
  )
    fileType = FileTypeEnum.document;
  if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow,'
  )
    fileType = FileTypeEnum.document;
  if (mimes === 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  if (mimes === 'application/vnd.ms-powerpoint,')
    fileType = FileTypeEnum.document;
  if (mimes === 'application/vnd.ms-powerpoint.presentation.macroEnabled.12,')
    fileType = FileTypeEnum.document;
  if (
    mimes ===
    'application/vnd.openxmlformats-officedocument.presentationml.presentation,'
  )
    fileType = FileTypeEnum.document;
  if (mimes === 'application/rtf,') fileType = FileTypeEnum.document;
  if (mimes === 'text/rtf,') fileType = FileTypeEnum.document;
  if (mimes === 'text/plain,') fileType = FileTypeEnum.document;
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
