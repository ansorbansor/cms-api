import { User } from 'src/entities/user.entity';
import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { UserRoles } from 'src/entities/user-role.entity';
import { RoleEnum } from 'src/utils/enums';
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

      const employeePosition = new EmployeePosition();
      employeePosition.name = 'Superadmin Position';
      const employeePositionData = await queryRunner.manager.save(
        employeePosition,
      );

      const user = new User();

      user.nik = '1';
      user.name = 'John Tor';
      user.email = 'john.tor@example.com';
      user.password = 'Password9';
      user.provider = 'email';
      user.employee_position_id = employeePositionData.id;
      user.photo = null;

      const userData = await queryRunner.manager.save(user);

      const userRole = new UserRoles();
      userRole.user_id = userData.id;
      userRole.role_id = RoleEnum.superadmin;
      await queryRunner.manager.save(userRole);

      await queryRunner.commitTransaction();
    }
  }
}
