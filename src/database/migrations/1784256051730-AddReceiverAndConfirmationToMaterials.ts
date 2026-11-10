import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceiverAndConfirmationToMaterials1784256051730 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "recipient_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_transactions" ADD COLUMN IF NOT EXISTS "receiver_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_transactions" ADD COLUMN IF NOT EXISTS "confirmation_photo" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_transactions" ADD COLUMN IF NOT EXISTS "lat" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_transactions" ADD COLUMN IF NOT EXISTS "lng" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "material_transactions" DROP COLUMN IF EXISTS "lng"`);
    await queryRunner.query(`ALTER TABLE "material_transactions" DROP COLUMN IF EXISTS "lat"`);
    await queryRunner.query(`ALTER TABLE "material_transactions" DROP COLUMN IF EXISTS "confirmation_photo"`);
    await queryRunner.query(`ALTER TABLE "material_transactions" DROP COLUMN IF EXISTS "receiver_id"`);
    await queryRunner.query(`ALTER TABLE "materials" DROP COLUMN IF EXISTS "recipient_id"`);
  }
}

