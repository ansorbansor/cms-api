import { registerAs } from '@nestjs/config';

export default registerAs('courseFetch', () => ({
  udemyClientId: process.env.UDEMY_CLIENT_ID,
  udemyClientSecret: process.env.UDEMY_CLIENT_ID,
}));
