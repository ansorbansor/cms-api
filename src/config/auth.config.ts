import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  secret: process.env.AUTH_JWT_SECRET,
  expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
  emailVerification: process.env.EMAIL_VERIFICATION,
  activateLDAP: process.env.ACTIVATE_LDAP,
}));
