import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getFlag } from '../utils/feature-flags.util';

@Injectable()
export class AppVersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const appVersionStr = req.headers['x-app-version'];
    
    // Only check if the header is provided. If it's not an app request (e.g. web CMS), it will pass.
    if (appVersionStr) {
      const appVersion = parseInt(appVersionStr as string, 10);
      const minAppVersion = getFlag('min_app_version', 14);

      if (!isNaN(appVersion) && appVersion < minAppVersion) {
        throw new HttpException(
          'Aplikasi versi ini sudah usang. Silakan update aplikasi Anda ke versi terbaru.',
          426,
        );
      }
    }

    next();
  }
}
