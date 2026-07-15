import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getFlag } from '../utils/feature-flags.util';

@Injectable()
export class AppVersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const appVersionStr = req.headers['x-app-version'];
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isAndroidApp = userAgent.includes('okhttp') || userAgent.includes('dalvik');

    const minAppVersion = getFlag('min_app_version', 14);
    const minTakeDataVersion = getFlag('min_takedata_app_version', 15);

    // Only strictly enforce on Android app requests. Web CMS requests pass through.
    if (isAndroidApp || appVersionStr) {
      // If Android app but no version header, assume version 0 (outdated)
      const appVersion = appVersionStr ? parseInt(appVersionStr as string, 10) : 0;

      if (!isNaN(appVersion)) {
        if (appVersion < minAppVersion) {
          throw new HttpException(
            'Aplikasi versi ini sudah usang. Silakan update aplikasi Anda ke versi terbaru.',
            426,
          );
        }

        if (req.originalUrl.includes('/take-data') && appVersion < minTakeDataVersion) {
          throw new HttpException(
            'Fitur Take Data tidak tersedia di versi aplikasi ini. Silakan update ke versi terbaru.',
            426,
          );
        }
      }
    }

    next();
  }
}
