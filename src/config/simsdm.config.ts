import { registerAs } from '@nestjs/config';

export default registerAs('simsdm', () => ({
  url: process.env.SIMSDM_URL,
  encryptionKey: process.env.SIMSDM_ENCRYPT_KEY,
  imageUrl: process.env.SIMSDM_IMAGE_URL,
}));
