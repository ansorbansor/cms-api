import { RoleEnum } from 'src/utils/enums';
import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { plainToClass } from 'class-transformer';
import { EmployeePosition } from 'src/entities/employee-position.entity';

export default class CreateAdmin implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const countRole = await connection
      .createQueryBuilder()
      .select()
      .from(EmployeePosition, 'EmployeePosition')
      .getCount();

    if (countRole === 0) {
      await connection
        .createQueryBuilder()
        .insert()
        .into(EmployeePosition)
        .values([
          plainToClass(EmployeePosition, {
            code: RoleEnum.SUPERADMIN,
            name: 'Super Admin',
          }),
        ])
        .execute();

      await connection
        .createQueryBuilder()
        .insert()
        .into(EmployeePosition)
        .values([
          plainToClass(EmployeePosition, {
            code: RoleEnum.USER,
            name: 'User',
          }),
        ])
        .execute();
    }
  }
}
