import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './utils/HttpExceptionFilter';
import { SerializerInterceptor } from './utils/serializer.interceptor';
import validationOptions from './utils/validation-options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);

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
    .addBearerAuth()
    .setExternalDoc('Postman Collection', '/docs-json')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  if (configService.get('app.nodeEnv') == 'staging') {
    SwaggerModule.setup('playbook/docs', app, document);
  } else if (configService.get('app.nodeEnv') == 'development') {
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(configService.get('app.port'));
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
