import { Module } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as admin from 'firebase-admin';
import appConfig from 'src/config/app.config';

@Module({})
export class FirebaseModule {
  constructor() {
    const path =
      __dirname +
      `/../../utils/${
        appConfig().nodeEnv == 'development'
          ? 'google-firebase-dev.json'
          : 'google-firebase.json'
      }`;
    const data = readFileSync(path, 'utf8');
    const firebaseCredentials = JSON.parse(data);
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentials),
    });
  }
}
