import { RoleEnum } from 'src/utils/enums';
import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { plainToClass } from 'class-transformer';
import { Role } from 'src/entities/role.entity';

export default class CreateAdmin implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const countRole = await connection
      .createQueryBuilder()
      .select()
      .from(Role, 'Role')
      .getCount();

    if (countRole === 0) {
      await connection
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values([
          plainToClass(Role, {
            id: RoleEnum.admin,
            name: 'Admin',
          }),
        ])
        .execute();

      await connection
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values([
          plainToClass(Role, {
            id: RoleEnum.user,
            name: 'User',
          }),
        ])
        .execute();
    }
  }
}
