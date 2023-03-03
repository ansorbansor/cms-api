import { User } from 'src/entities/user.entity';
import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { EmployeePosition } from 'src/entities/employee-position.entity';

export default class CreateAdmin implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const countUser = await connection
      .createQueryBuilder()
      .select()
      .from(User, 'User')
      .getCount();

    if (countUser === 0) {
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let existsEmployeePosition = await connection
        .createQueryBuilder()
        .select()
        .from(EmployeePosition, 'EmployeePosition')
        .where('EmployeePosition.name = :name', {
          name: 'Superadmin Position',
        })
        .getOne();

      if (!existsEmployeePosition) {
        const employeePosition = new EmployeePosition();
        employeePosition.name = 'Superadmin Position';
        existsEmployeePosition = await queryRunner.manager.save(
          employeePosition,
        );
      }

      const user = new User();

      user.nik = '1';
      user.name = 'John Tor';
      user.email = 'john.tor@example.com';
      user.password = 'Password9';
      user.provider = 'email';
      user.employee_position_id = existsEmployeePosition.id;
      user.photo = null;

      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
    }
  }
}
