import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAppSessionIdToUser1784256051728 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "app_session_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "app_session_id"`);
    }

}
