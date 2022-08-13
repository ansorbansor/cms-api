import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  baseUrl: process.env.MINIO_BASE_URL,
  bucketName: process.env.MINIO_BUCKET_NAME,
  port: process.env.MINIO_PORT,
  fullUrl: process.env.MINIO_BASE_URL + ':' + process.env.MINIO_PORT + '/',
}));
