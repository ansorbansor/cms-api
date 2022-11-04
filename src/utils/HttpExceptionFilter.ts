import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import appConfig from 'src/config/app.config';
import { ErrorMessage } from './enums';

@Catch(TypeError)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: TypeError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (appConfig().nodeEnv != 'production') {
      console.log(`${exception.message} \n ${exception.stack}`);
    }

    response.status(status).json({
      meta: {
        code: status,
        message: ErrorMessage.GENERAL,
      },
      data: null,
    });
  }
}
