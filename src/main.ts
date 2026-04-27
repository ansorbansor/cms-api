import './polyfill';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './utils/HttpExceptionFilter';
import { SerializerInterceptor } from './utils/serializer.interceptor';
import validationOptions from './utils/validation-options';
import moment from 'moment';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as newrelic from 'newrelic';
require('newrelic');
import * as os from 'os';
import cluster from 'cluster';
const numCPUs = os.cpus().length;

async function bootstrap() {
  // ✅ TEST: Add a log to confirm this new code is running.
  console.log('--- BOOTSTRAP STARTED WITH LATEST CORS FIX ---');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: ['https://smarteye.ptbiosron.my.id', 'https://smarteye-api.ptbiosron.com', 'https://smarteye.ptbiosron.com', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });


  moment.locale('id');

  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.get('app.apiPrefix'), {
    exclude: ['/'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalInterceptors(new SerializerInterceptor());
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalFilters(new HttpExceptionFilter());

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth();

  options.setExternalDoc('Postman Collection', '/docs-json');

  const document = SwaggerModule.createDocument(app, options.build());
  SwaggerModule.setup('docs', app, document);

  if (process.env.NODE_ENV == 'local') {
    // Listen on all interfaces so Android devices on the same LAN can connect
    await app.listen(configService.get('app.port'), '0.0.0.0');
  } else {
    // Disable cluster mode to prevent multiple Puppeteer/WhatsApp instances 
    // from crashing due to conflicting access to the same .wwebjs_auth directory.
    await app.listen(configService.get('app.port'), '0.0.0.0');
    console.log(`Server started on port ${configService.get('app.port')}`);
  }
}

databaseInfo();
bootstrap();

function databaseInfo() {
  console.log('========================');
  console.log('========DATABASE========');
  console.log(`type: ${process.env.DATABASE_TYPE}`);
  console.log(`host: ${process.env.DATABASE_HOST}`);
  console.log(`port: ${process.env.DATABASE_PORT}`);
  console.log(`database: ${process.env.DATABASE_NAME}`);
}

