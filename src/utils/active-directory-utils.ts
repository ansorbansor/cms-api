import * as ActiveDirectory from 'activedirectory2';
import activeDirectoryConfig from 'src/config/active-directory.config';
import { MCrypt } from 'mcrypt';

export class ActiveDirectoryUtils {
  private ad: ActiveDirectory;

  constructor() {
    const config = {
      url: activeDirectoryConfig().host,
      baseDN: activeDirectoryConfig().baseDN,
      username: activeDirectoryConfig().username,
      password: activeDirectoryConfig().password,
    };

    this.ad = new ActiveDirectory(config);
  }

  async authAD(username: string, password: string): Promise<any> {
    return await new Promise((resolve) => {
      return this.ad.authenticate(username, password, (err, auth) => {
        if (auth) {
          resolve(auth);
        } else if (err) {
          console.log('AD ERROR: ' + JSON.stringify(err));
        }

        resolve(null);
      });
    });
  }

  decryptSIMSDMData(value: string) {
    const encrypted = Buffer.from(value, 'base64'); //holds our encrypted data
    const key = 'Buk43nkr1p$1!nYA'; // holds our 32 bytes key

    const desEcb = new MCrypt('rijndael-256', 'ecb');
    desEcb.open(key); // we are set the key

    const plaintext = desEcb.decrypt(encrypted);

    return plaintext.toString().replace(/\0/g, '');
  }
}
