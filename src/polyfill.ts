import * as crypto from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}
