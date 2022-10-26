import { registerAs } from '@nestjs/config';

export default registerAs('activeDirectory', () => ({
  host: process.env.ACTIVE_DIRECTORY_HOST,
  baseDN: process.env.ACTIVE_DIRECTORY_BASESDN,
  username: process.env.ACTIVE_DIRECTORY_USERNAME,
  password: process.env.ACTIVE_DIRECTORY_PASSWORD,
}));
