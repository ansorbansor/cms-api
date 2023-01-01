import { registerAs } from '@nestjs/config';

export default registerAs('file', () => ({
  driver: process.env.FILE_DRIVER,
  maxFileSize: 120971520, // 20mb
}));
