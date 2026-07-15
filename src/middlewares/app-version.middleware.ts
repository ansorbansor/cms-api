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

    if (isAndroidApp) {
      if (!appVersionStr) {
        // Legacy APK without version header.
        // It's older than our header implementation, so strictly block /take-data
        if (req.originalUrl.includes('/take-data')) {
          throw new HttpException(
            'Fitur Take Data tidak tersedia di versi aplikasi ini. Silakan update ke versi terbaru.',
            426,
          );
        }
      } else {
        const appVersion = parseInt(appVersionStr as string, 10);
        if (!isNaN(appVersion)) {
          // 1. Global block check
          if (appVersion < minAppVersion) {
            throw new HttpException(
              'Aplikasi versi ini sudah usang. Silakan update aplikasi Anda ke versi terbaru.',
              426,
            );
          }

          // 2. Take Data specific block check
          if (req.originalUrl.includes('/take-data') && appVersion < minTakeDataVersion) {
            throw new HttpException(
              'Fitur Take Data tidak tersedia di versi aplikasi ini. Silakan update ke versi terbaru.',
              426,
            );
          }
        }
      }
    }

    next();
  }
}
