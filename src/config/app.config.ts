import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  name: process.env.APP_NAME,
  workingDirectory: process.env.PWD || process.cwd(),
  frontendDomain: process.env.FRONTEND_DOMAIN,
  cmsDomain: process.env.CMS_DOMAIN,
  backendDomain: process.env.BACKEND_DOMAIN,
  apiVersion: process.env.API_VERSION,
  fullBackendDomain: `${process.env.BACKEND_DOMAIN}/${process.env.API_PREFIX}/${process.env.API_VERSION}/`,
  port: parseInt(process.env.APP_PORT || process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
  spkOperationMaxBudget:
    parseInt(process.env.SPK_OPERATIONAL_MAX_BUDGET) || 100000000,
}));
