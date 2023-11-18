import * as crypto from 'crypto';
import authConfig from 'src/config/auth.config';
import { promisify } from 'util';

export async function encryptText(text) {
  const iv = crypto.randomBytes(16);
  const key = (await promisify(crypto.scrypt)(
    authConfig().secret,
    authConfig().secret,
    32,
  )) as Buffer;
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text.toString());

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function decryptText(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const key = (await promisify(crypto.scrypt)(
    authConfig().secret,
    authConfig().secret,
    32,
  )) as Buffer;
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

export function exportUniqueId(id: number, createdAt: string) {
  const dateOnly = createdAt.split(' ')[0];
  const dateOnlySplit = dateOnly.split('-');
  const year = dateOnlySplit[0];
  const month = dateOnlySplit[1];
  const day = dateOnlySplit[2];
  // 2023BSN-ddmm-uniq
  return `${year}BSN-${month}${day}-${id}`;
}

export function importUniqueId(uniqueId: string) {
  return uniqueId.split('-')[2];
}
