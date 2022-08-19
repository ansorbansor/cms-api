import {
  HttpStatus,
  ValidationError,
  ValidationPipeOptions,
} from '@nestjs/common';
import { failedResponse } from './responses';

const validationOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  exceptionFactory: (errors: ValidationError[]) => {
    return failedResponse(
      HttpStatus.UNPROCESSABLE_ENTITY,
      errors.length > 0
        ? errors[0].constraints
          ? Object.values(errors[0].constraints).join(', ')
          : errors[0].children[0]
          ? Object.values(errors[0].children[0].children[0].constraints).join(
              ', ',
            )
          : 'Terjadi kesalahan pada server'
        : 'Terjadi kesalahan pada server',
    );
  },
};

export default validationOptions;
