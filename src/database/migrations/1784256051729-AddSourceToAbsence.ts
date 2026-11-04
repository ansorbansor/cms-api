import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceToAbsence1784256051729 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "source" character varying(50) DEFAULT 'app'`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "clock_in_source" character varying(50) DEFAULT 'app'`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "clock_out_source" character varying(50) DEFAULT 'app'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "clock_out_source"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "clock_in_source"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "source"`);
  }
}

