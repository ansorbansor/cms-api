import { MigrationInterface, QueryRunner } from 'typeorm';

export class RevampAbsenceAndLeaveQuota1784256051732 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "absence_type" character varying(50) DEFAULT 'CLOCK_IN_OUT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "status" character varying(50) DEFAULT 'COMPLETED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "absence_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "is_clarification" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "special_leave_type" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "evidence_file_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "evidence_uploaded_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "deadline_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "notes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "rejection_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "rejected_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "reviewed_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "absence" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP`,
    );

    // Populate absence_date for existing rows from clock_in
    await queryRunner.query(
      `UPDATE "absence" SET "absence_date" = "clock_in"::date WHERE "absence_date" IS NULL AND "clock_in" IS NOT NULL`,
    );

    // Create leave_quotas table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_quotas" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "year" integer NOT NULL,
        "total_quota" integer NOT NULL DEFAULT 12,
        "used_quota" integer NOT NULL DEFAULT 0,
        "remaining_quota" integer NOT NULL DEFAULT 12,
        "adjustment_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_quotas_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leave_quotas_user_year" UNIQUE ("user_id", "year")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_quotas"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "reviewed_at"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "reviewed_by"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "rejected_at"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "notes"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "deadline_at"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "evidence_uploaded_at"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "evidence_file_id"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "special_leave_type"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "is_clarification"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "absence_date"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "absence" DROP COLUMN IF EXISTS "absence_type"`);
  }
}
