import { User } from 'src/entities/user.entity';
import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { UserRoles } from 'src/entities/user-role.entity';
import { RoleEnum } from 'src/utils/enums';

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

      const user = new User();

      user.nip = '1';
      user.name = 'John Tor';
      user.email = 'john.tor@example.com';
      user.password = 'Password9';
      user.provider = 'email';

      const userData = await queryRunner.manager.save(user);

      const userRole = new UserRoles();
      userRole.user_id = userData.id;
      userRole.role_id = RoleEnum.superadmin;
      await queryRunner.manager.save(userRole);

      await queryRunner.commitTransaction();
    }
  }
}
