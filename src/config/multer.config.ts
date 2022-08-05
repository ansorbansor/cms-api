import { registerAs } from '@nestjs/config';

export default registerAs('multer', () => ({
  destination: process.env.MULTER_DESTINATION,
}));
