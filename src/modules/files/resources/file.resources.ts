/* eslint-disable prettier/prettier */

import minioConfig from "src/config/minio.config";
import { FileEntity } from "src/entities/file.entity";

export const FileResource = (file: FileEntity): any => {
  return {
    name: file && file.name ? file.name : null,
    path: file && file.path ? minioConfig().fullUrl + file.path : null,
    description: file && file.description ? file.description : null,
  };
};
