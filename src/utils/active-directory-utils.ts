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

    console.log(config);

    this.ad = new ActiveDirectory(config);
  }

  async authAD(username: string, password: string): Promise<any> {
    return await new Promise((resolve) => {
      return this.ad.authenticate(username, password, (err, auth) => {
        if (err) {
          console.log('AD ERROR: ' + JSON.stringify(err));
          resolve(err);
        }

        if (auth) {
          resolve(auth);
        }

        resolve(null);
      });
    });
  }
}
