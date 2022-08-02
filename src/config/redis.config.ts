import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  status: process.env.REDIS_STATUS,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  expiration: process.env.REDIS_EXPIRATION,
}));
