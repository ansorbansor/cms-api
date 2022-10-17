import { Module } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as admin from 'firebase-admin';

@Module({})
export class FirebaseModule {
  constructor() {
    const path = __dirname + '/../../utils/google-firebase.json';
    const data = readFileSync(path, 'utf8');
    const firebaseCredentials = JSON.parse(data);
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentials),
    });
  }
}
