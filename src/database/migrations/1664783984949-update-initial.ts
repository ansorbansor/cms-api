import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateInitial1664783984949 implements MigrationInterface {
  name = 'updateInitial1664783984949';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`files\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`file_type\` int NOT NULL, \`extension\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`path\` varchar(255) NOT NULL, \`user_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`menus\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`be_controller\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`role_access\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`role_id\` int NOT NULL, \`menu_id\` int NOT NULL, \`menu_access\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_roles\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`role_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`employee_units\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, INDEX \`IDX_cbca4728e3ad24347eb78a2148\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`employee_levels\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, INDEX \`IDX_868e43212c4b2a07194f1fb9da\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`employee_positions\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, INDEX \`IDX_e78ea5c8a738b91a8a0564ad45\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`providers\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`fetch_data\` tinyint NOT NULL, \`photo\` int NOT NULL, \`last_update\` datetime NOT NULL, \`url\` varchar(255) NOT NULL, UNIQUE INDEX \`REL_a2c6117f3136d54e7a3bb3a171\` (\`photo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`topics\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`category_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`categories\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`photo\` int NOT NULL, \`pkasn_program\` varchar(255) NOT NULL, UNIQUE INDEX \`REL_f339f13ccfd45ad1b53933c840\` (\`photo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_levels\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_prices\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_likes\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`course_id\` int NOT NULL, UNIQUE INDEX \`REL_b7b46715958a1fd4f5aba9b16c\` (\`course_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_languages\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_language_transactions\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`course_id\` int NOT NULL, \`language_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`coupons\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`provider_id\` int NOT NULL, \`amount\` int NOT NULL, \`type\` int NOT NULL, \`course_id\` int NOT NULL, \`status\` int NOT NULL, \`start_date\` datetime NOT NULL, \`end_date\` datetime NOT NULL, UNIQUE INDEX \`REL_cbfc36859d6d455581303e8508\` (\`course_id\`), UNIQUE INDEX \`REL_e7c2447cf1f5cbdde98b424277\` (\`provider_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`coupon_submissions\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`course_id\` int NOT NULL, \`coupon_id\` int NOT NULL, \`status\` int NOT NULL, \`status_by\` int NOT NULL, \`reason\` varchar(255) NOT NULL, UNIQUE INDEX \`REL_32f03abf992ecb4dace63af7a9\` (\`course_id\`), UNIQUE INDEX \`REL_fdb4de8789e127e4ceb9d5907b\` (\`user_id\`), UNIQUE INDEX \`REL_f9035494e16a92bcaa0b68e123\` (\`coupon_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`editor_choice_courses\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`course_id\` int NOT NULL, \`position\` int NOT NULL, UNIQUE INDEX \`REL_1f45fde1ae0f34d2170959e1e3\` (\`course_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`temporary_courses\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`external_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`coach\` varchar(255) NOT NULL, \`duration\` int NOT NULL, \`provider_id\` int NOT NULL, \`category\` varchar(255) NOT NULL, \`topic\` varchar(255) NOT NULL, \`level\` varchar(255) NOT NULL, \`date_course\` datetime NOT NULL, \`rating\` int NOT NULL, \`description\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`freemium_code\` varchar(255) NOT NULL, \`photo\` varchar(255) NOT NULL, \`language\` varchar(255) NOT NULL, UNIQUE INDEX \`REL_2bd0c8d1256d217c8c5a5a5cf5\` (\`external_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`courses\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`external_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`coach\` varchar(255) NOT NULL, \`duration\` int NOT NULL, \`provider_id\` int NOT NULL, \`category_id\` int NOT NULL, \`status\` tinyint NOT NULL, \`topic_id\` int NOT NULL, \`level_id\` int NOT NULL, \`date_course\` datetime NOT NULL, \`rating\` int NOT NULL, \`rating_count\` int NOT NULL, \`description\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`price_id\` int NOT NULL, \`price\` int NOT NULL, \`freemium_code\` varchar(255) NOT NULL, \`photo\` int NOT NULL, UNIQUE INDEX \`REL_0065620713f1cb3be5d8bc9a31\` (\`external_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_courses\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`course_id\` int NOT NULL, \`progress\` int NOT NULL, \`certificate_date\` datetime NOT NULL, \`certificate_number\` varchar(255) NOT NULL, \`certificate_image\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_topics\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`category_id\` int NOT NULL, \`topic_id\` int NOT NULL, UNIQUE INDEX \`REL_01965f1d77b2ce949d4f931ed1\` (\`user_id\`), UNIQUE INDEX \`REL_f476af82d8a6bc40b3df2cce3a\` (\`category_id\`), UNIQUE INDEX \`REL_0e654422951cf9f0b933125b79\` (\`topic_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`nip\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`provider\` varchar(255) NOT NULL DEFAULT 'email', \`photo\` int NOT NULL, \`unit_id\` int NOT NULL, \`level_id\` int NOT NULL, \`position_id\` int NOT NULL, \`course_level\` int NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, \`blacklist\` tinyint NOT NULL DEFAULT 0, \`notification_token\` varchar(255) NULL, \`hash\` varchar(255) NULL, \`level\` int NOT NULL, INDEX \`IDX_51b8b26ac168fbe7d6f5653e6c\` (\`name\`), INDEX \`IDX_3676155292d72c67cd4e090514\` (\`status\`), INDEX \`IDX_73484210d4ae57a6bc147a4735\` (\`blacklist\`), UNIQUE INDEX \`IDX_9fe1d41682c0112df58dc74505\` (\`nip\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`REL_da675fff89ce00f36453c8b242\` (\`photo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_logs\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`description\` varchar(255) NOT NULL, \`ip\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`banners\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`type\` int NOT NULL, \`course_id\` int NOT NULL, \`content\` varchar(255) NOT NULL, \`external_url\` varchar(255) NOT NULL, \`photo\` int NOT NULL, \`position\` int NOT NULL, \`status\` tinyint NOT NULL, UNIQUE INDEX \`REL_ad541942072eb2d89255a27648\` (\`photo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_durations\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`minimum\` int NOT NULL, \`maximum\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_fetch_histories\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`provider_id\` int NOT NULL, \`first_page\` int NOT NULL, \`last_page\` int NOT NULL, \`limit\` int NOT NULL, \`item_count\` int NOT NULL, \`total_item_count\` int NOT NULL, \`total_item_inserted\` int NOT NULL, \`provider_category_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_fetch_settings\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`provider_id\` int NOT NULL, \`type\` varchar(255) NOT NULL, \`value\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`forgot_password\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`hash\` varchar(255) NOT NULL, \`user_id\` int NULL, INDEX \`IDX_337214c0b070d18bf6a64955ed\` (\`hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`provider_categories\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`provider_id\` int NOT NULL, \`external_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`files\` ADD CONSTRAINT \`FK_a7435dbb7583938d5e7d1376041\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_access\` ADD CONSTRAINT \`FK_2f7f67d507a08448012c08be75b\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_access\` ADD CONSTRAINT \`FK_392e56195c227865f2740b9c0b4\` FOREIGN KEY (\`menu_id\`) REFERENCES \`menus\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_87b8888186ca9769c960e926870\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_b23c65e50a758245a33ee35fda1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`providers\` ADD CONSTRAINT \`FK_a2c6117f3136d54e7a3bb3a1713\` FOREIGN KEY (\`photo\`) REFERENCES \`files\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`topics\` ADD CONSTRAINT \`FK_55f03ccaeee22a418c4b00b83a2\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` ADD CONSTRAINT \`FK_f339f13ccfd45ad1b53933c8408\` FOREIGN KEY (\`photo\`) REFERENCES \`files\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_likes\` ADD CONSTRAINT \`FK_b7b46715958a1fd4f5aba9b16c2\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_language_transactions\` ADD CONSTRAINT \`FK_24a1d4010ab38a9af02aea1168c\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_language_transactions\` ADD CONSTRAINT \`FK_a19c45d85305b164cb8d4dd49ef\` FOREIGN KEY (\`language_id\`) REFERENCES \`course_languages\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupons\` ADD CONSTRAINT \`FK_cbfc36859d6d455581303e85088\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupons\` ADD CONSTRAINT \`FK_e7c2447cf1f5cbdde98b4242778\` FOREIGN KEY (\`provider_id\`) REFERENCES \`providers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon_submissions\` ADD CONSTRAINT \`FK_32f03abf992ecb4dace63af7a9f\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon_submissions\` ADD CONSTRAINT \`FK_fdb4de8789e127e4ceb9d5907b7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon_submissions\` ADD CONSTRAINT \`FK_f9035494e16a92bcaa0b68e1232\` FOREIGN KEY (\`coupon_id\`) REFERENCES \`coupons\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`editor_choice_courses\` ADD CONSTRAINT \`FK_1f45fde1ae0f34d2170959e1e3e\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`temporary_courses\` ADD CONSTRAINT \`FK_2bd0c8d1256d217c8c5a5a5cf56\` FOREIGN KEY (\`external_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_6158bff272157e1e16498eed44d\` FOREIGN KEY (\`provider_id\`) REFERENCES \`providers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_e4c260fe6bb1131707c4617f745\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_b460373ff08936c854b013d014a\` FOREIGN KEY (\`topic_id\`) REFERENCES \`topics\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_41909d41b68fc950fd9bc684721\` FOREIGN KEY (\`level_id\`) REFERENCES \`course_levels\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_53cd9d9504fd7f538e4332ad3ce\` FOREIGN KEY (\`price_id\`) REFERENCES \`course_prices\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_fe0708909fd8712fe770490bee2\` FOREIGN KEY (\`photo\`) REFERENCES \`files\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_0065620713f1cb3be5d8bc9a315\` FOREIGN KEY (\`external_id\`) REFERENCES \`temporary_courses\`(\`external_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_courses\` ADD CONSTRAINT \`FK_7ecb10d15b858768c36d37727f9\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_courses\` ADD CONSTRAINT \`FK_d65a2771413a10753d76937b3d6\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_topics\` ADD CONSTRAINT \`FK_01965f1d77b2ce949d4f931ed1c\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_topics\` ADD CONSTRAINT \`FK_f476af82d8a6bc40b3df2cce3a2\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_topics\` ADD CONSTRAINT \`FK_0e654422951cf9f0b933125b79f\` FOREIGN KEY (\`topic_id\`) REFERENCES \`topics\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_da675fff89ce00f36453c8b2423\` FOREIGN KEY (\`photo\`) REFERENCES \`files\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_b94ecc6be926a5d23aa7791ec8a\` FOREIGN KEY (\`unit_id\`) REFERENCES \`employee_units\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_08f642b752f63f945086eccbc8d\` FOREIGN KEY (\`level_id\`) REFERENCES \`employee_levels\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_8e29a9d2f1fa57ebf1a4ce17353\` FOREIGN KEY (\`position_id\`) REFERENCES \`employee_positions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_logs\` ADD CONSTRAINT \`FK_d54f841fa5478e4734590d44036\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`banners\` ADD CONSTRAINT \`FK_ad541942072eb2d89255a276488\` FOREIGN KEY (\`photo\`) REFERENCES \`files\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`banners\` ADD CONSTRAINT \`FK_1706139d2a05b63cb5682376fe3\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`forgot_password\` ADD CONSTRAINT \`FK_93500e0a028c94b4c54ecaa6351\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`forgot_password\` DROP FOREIGN KEY \`FK_93500e0a028c94b4c54ecaa6351\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`banners\` DROP FOREIGN KEY \`FK_1706139d2a05b63cb5682376fe3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`banners\` DROP FOREIGN KEY \`FK_ad541942072eb2d89255a276488\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_logs\` DROP FOREIGN KEY \`FK_d54f841fa5478e4734590d44036\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_8e29a9d2f1fa57ebf1a4ce17353\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_08f642b752f63f945086eccbc8d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_b94ecc6be926a5d23aa7791ec8a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_da675fff89ce00f36453c8b2423\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_topics\` DROP FOREIGN KEY \`FK_0e654422951cf9f0b933125b79f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_topics\` DROP FOREIGN KEY \`FK_f476af82d8a6bc40b3df2cce3a2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_topics\` DROP FOREIGN KEY \`FK_01965f1d77b2ce949d4f931ed1c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_courses\` DROP FOREIGN KEY \`FK_d65a2771413a10753d76937b3d6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_courses\` DROP FOREIGN KEY \`FK_7ecb10d15b858768c36d37727f9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_0065620713f1cb3be5d8bc9a315\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_fe0708909fd8712fe770490bee2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_53cd9d9504fd7f538e4332ad3ce\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_41909d41b68fc950fd9bc684721\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_b460373ff08936c854b013d014a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_e4c260fe6bb1131707c4617f745\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_6158bff272157e1e16498eed44d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`temporary_courses\` DROP FOREIGN KEY \`FK_2bd0c8d1256d217c8c5a5a5cf56\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`editor_choice_courses\` DROP FOREIGN KEY \`FK_1f45fde1ae0f34d2170959e1e3e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon_submissions\` DROP FOREIGN KEY \`FK_f9035494e16a92bcaa0b68e1232\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon_submissions\` DROP FOREIGN KEY \`FK_fdb4de8789e127e4ceb9d5907b7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon_submissions\` DROP FOREIGN KEY \`FK_32f03abf992ecb4dace63af7a9f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupons\` DROP FOREIGN KEY \`FK_e7c2447cf1f5cbdde98b4242778\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupons\` DROP FOREIGN KEY \`FK_cbfc36859d6d455581303e85088\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_language_transactions\` DROP FOREIGN KEY \`FK_a19c45d85305b164cb8d4dd49ef\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_language_transactions\` DROP FOREIGN KEY \`FK_24a1d4010ab38a9af02aea1168c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_likes\` DROP FOREIGN KEY \`FK_b7b46715958a1fd4f5aba9b16c2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` DROP FOREIGN KEY \`FK_f339f13ccfd45ad1b53933c8408\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`topics\` DROP FOREIGN KEY \`FK_55f03ccaeee22a418c4b00b83a2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`providers\` DROP FOREIGN KEY \`FK_a2c6117f3136d54e7a3bb3a1713\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_b23c65e50a758245a33ee35fda1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_87b8888186ca9769c960e926870\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_access\` DROP FOREIGN KEY \`FK_392e56195c227865f2740b9c0b4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_access\` DROP FOREIGN KEY \`FK_2f7f67d507a08448012c08be75b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`files\` DROP FOREIGN KEY \`FK_a7435dbb7583938d5e7d1376041\``,
    );
    await queryRunner.query(`DROP TABLE \`provider_categories\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_337214c0b070d18bf6a64955ed\` ON \`forgot_password\``,
    );
    await queryRunner.query(`DROP TABLE \`forgot_password\``);
    await queryRunner.query(`DROP TABLE \`course_fetch_settings\``);
    await queryRunner.query(`DROP TABLE \`course_fetch_histories\``);
    await queryRunner.query(`DROP TABLE \`course_durations\``);
    await queryRunner.query(
      `DROP INDEX \`REL_ad541942072eb2d89255a27648\` ON \`banners\``,
    );
    await queryRunner.query(`DROP TABLE \`banners\``);
    await queryRunner.query(`DROP TABLE \`activity_logs\``);
    await queryRunner.query(
      `DROP INDEX \`REL_da675fff89ce00f36453c8b242\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9fe1d41682c0112df58dc74505\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_73484210d4ae57a6bc147a4735\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3676155292d72c67cd4e090514\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_51b8b26ac168fbe7d6f5653e6c\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`REL_0e654422951cf9f0b933125b79\` ON \`user_topics\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_f476af82d8a6bc40b3df2cce3a\` ON \`user_topics\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_01965f1d77b2ce949d4f931ed1\` ON \`user_topics\``,
    );
    await queryRunner.query(`DROP TABLE \`user_topics\``);
    await queryRunner.query(`DROP TABLE \`user_courses\``);
    await queryRunner.query(
      `DROP INDEX \`REL_0065620713f1cb3be5d8bc9a31\` ON \`courses\``,
    );
    await queryRunner.query(`DROP TABLE \`courses\``);
    await queryRunner.query(
      `DROP INDEX \`REL_2bd0c8d1256d217c8c5a5a5cf5\` ON \`temporary_courses\``,
    );
    await queryRunner.query(`DROP TABLE \`temporary_courses\``);
    await queryRunner.query(
      `DROP INDEX \`REL_1f45fde1ae0f34d2170959e1e3\` ON \`editor_choice_courses\``,
    );
    await queryRunner.query(`DROP TABLE \`editor_choice_courses\``);
    await queryRunner.query(
      `DROP INDEX \`REL_f9035494e16a92bcaa0b68e123\` ON \`coupon_submissions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_fdb4de8789e127e4ceb9d5907b\` ON \`coupon_submissions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_32f03abf992ecb4dace63af7a9\` ON \`coupon_submissions\``,
    );
    await queryRunner.query(`DROP TABLE \`coupon_submissions\``);
    await queryRunner.query(
      `DROP INDEX \`REL_e7c2447cf1f5cbdde98b424277\` ON \`coupons\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_cbfc36859d6d455581303e8508\` ON \`coupons\``,
    );
    await queryRunner.query(`DROP TABLE \`coupons\``);
    await queryRunner.query(`DROP TABLE \`course_language_transactions\``);
    await queryRunner.query(`DROP TABLE \`course_languages\``);
    await queryRunner.query(
      `DROP INDEX \`REL_b7b46715958a1fd4f5aba9b16c\` ON \`user_likes\``,
    );
    await queryRunner.query(`DROP TABLE \`user_likes\``);
    await queryRunner.query(`DROP TABLE \`course_prices\``);
    await queryRunner.query(`DROP TABLE \`course_levels\``);
    await queryRunner.query(
      `DROP INDEX \`REL_f339f13ccfd45ad1b53933c840\` ON \`categories\``,
    );
    await queryRunner.query(`DROP TABLE \`categories\``);
    await queryRunner.query(`DROP TABLE \`topics\``);
    await queryRunner.query(
      `DROP INDEX \`REL_a2c6117f3136d54e7a3bb3a171\` ON \`providers\``,
    );
    await queryRunner.query(`DROP TABLE \`providers\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e78ea5c8a738b91a8a0564ad45\` ON \`employee_positions\``,
    );
    await queryRunner.query(`DROP TABLE \`employee_positions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_868e43212c4b2a07194f1fb9da\` ON \`employee_levels\``,
    );
    await queryRunner.query(`DROP TABLE \`employee_levels\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_cbca4728e3ad24347eb78a2148\` ON \`employee_units\``,
    );
    await queryRunner.query(`DROP TABLE \`employee_units\``);
    await queryRunner.query(`DROP TABLE \`user_roles\``);
    await queryRunner.query(`DROP TABLE \`roles\``);
    await queryRunner.query(`DROP TABLE \`role_access\``);
    await queryRunner.query(`DROP TABLE \`menus\``);
    await queryRunner.query(`DROP TABLE \`files\``);
  }
}
