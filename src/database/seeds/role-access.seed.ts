import { Connection } from 'typeorm';
import type { Factory, Seeder } from 'typeorm-seeding';
import { Menu } from 'src/entities/menu.entity';
import { RoleAccess } from 'src/entities/role-access.entity';

export default class CreateMenu implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const countMenu = await connection
      .createQueryBuilder()
      .select()
      .from(RoleAccess, 'roleAccess')
      .getCount();

    if (countMenu === 0) {
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const listMenus = [];
      let menu = new Menu();
      //add menu user
      menu.name = 'Pengguna';
      menu.be_controller = 'UserController';
      listMenus.push(menu);
      //add menu role
      menu = new Menu();
      menu.name = 'Peran Pengguna';
      menu.be_controller = 'RoleController';
      listMenus.push(menu);
      //add menu blacklist user
      menu = new Menu();
      menu.name = 'Blacklist';
      menu.be_controller = 'BlacklistController';
      listMenus.push(menu);
      //add menu provider
      menu = new Menu();
      menu.name = 'Penyelenggara';
      menu.be_controller = 'ProvidersController';
      listMenus.push(menu);
      //add menu activity log user
      menu = new Menu();
      menu.name = 'Activity Log';
      menu.be_controller = 'ActivityLogController';
      listMenus.push(menu);
      //add menu course category
      menu = new Menu();
      menu.name = 'Kategori';
      menu.be_controller = 'CourseCategoriesController';
      listMenus.push(menu);
      //add menu course
      menu = new Menu();
      menu.name = 'Course';
      menu.be_controller = 'CourseController';
      listMenus.push(menu);
      //add menu provider fetch
      menu = new Menu();
      menu.name = 'Update Data Penyelenggara';
      menu.be_controller = 'ProviderFetchController';
      listMenus.push(menu);
      //add menu provider fetch
      menu = new Menu();
      menu.name = 'Kupon';
      menu.be_controller = 'CouponController';
      listMenus.push(menu);
      //add menu provider fetch
      menu = new Menu();
      menu.name = 'Pengajuan Kupon';
      menu.be_controller = 'CouponSubmissionController';
      listMenus.push(menu);
      //add menu banner
      menu = new Menu();
      menu.name = 'Banner';
      menu.be_controller = 'BannerController';
      listMenus.push(menu);
      //add menu banner
      menu = new Menu();
      menu.name = 'Pilihan Editor';
      menu.be_controller = 'CourseChoiceController';
      listMenus.push(menu);

      await queryRunner.manager.save(listMenus);

      await queryRunner.commitTransaction();
    }
  }
}
