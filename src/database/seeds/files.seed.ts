import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { FileEntity } from 'src/entities/file.entity';

export default class CreateMenu implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const countMenu = await connection
      .createQueryBuilder()
      .select()
      .from(FileEntity, 'files')
      .getCount();

    if (countMenu === 0) {
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const listFiles = [];
      const file = new FileEntity();
      //add file import user
      file.name = 'user';
      file.path = 'playbook-bucket/systems/import-template/user.xlsx';
      file.file_type = 1;
      file.extension = 'xlsx';
      file.description = 'import-excel-user';
      file.user_id = 1;
      listFiles.push(file);
      //add file import user blacklist
      file.name = 'blacklist-user';
      file.path = 'playbook-bucket/systems/import-template/blacklist-user.xlsx';
      file.file_type = 1;
      file.extension = 'xlsx';
      file.description = 'import-excel-blacklist-user';
      file.user_id = 1;
      listFiles.push(file);
      //add file import user
      file.name = 'level-user';
      file.path = 'playbook-bucket/systems/import-template/level-user.xlsx';
      file.file_type = 1;
      file.extension = 'xlsx';
      file.description = 'import-excel-level-user';
      file.user_id = 1;
      listFiles.push(file);

      await queryRunner.manager.save(listFiles);

      await queryRunner.commitTransaction();
    }
  }
}
