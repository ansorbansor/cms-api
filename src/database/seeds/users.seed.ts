import { User } from 'src/entities/user.entity';
import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { UserRoles } from 'src/entities/user-role.entity';
import { RoleEnum } from 'src/utils/enums';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
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

      const employeeUnit = new EmployeeUnit();
      employeeUnit.name = 'Superadmin Unit';
      const employeeUnitData = await queryRunner.manager.save(employeeUnit);

      const employeeLevel = new EmployeeLevel();
      employeeLevel.name = 'Superadmin Level';
      const employeeLevelData = await queryRunner.manager.save(employeeLevel);

      const employeePosition = new EmployeePosition();
      employeePosition.name = 'Superadmin Position';
      const employeePositionData = await queryRunner.manager.save(
        employeePosition,
      );

      const user = new User();

      user.nip = '1';
      user.name = 'John Tor';
      user.email = 'john.tor@example.com';
      user.password = 'Password9';
      user.provider = 'email';
      user.unit_id = employeeUnitData.id;
      user.level_id = employeeLevelData.id;
      user.position_id = employeePositionData.id;
      user.photo = null;
      user.course_level = 0;
      user.level = 0;

      const userData = await queryRunner.manager.save(user);

      const userRole = new UserRoles();
      userRole.user_id = userData.id;
      userRole.role_id = RoleEnum.superadmin;
      await queryRunner.manager.save(userRole);

      await queryRunner.commitTransaction();
    }
  }
}
