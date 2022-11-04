import * as ActiveDirectory from 'activedirectory2';
import activeDirectoryConfig from 'src/config/active-directory.config';

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
}
