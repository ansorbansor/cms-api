import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQtyToPurchaseOrderInvoices1784256051733 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_order_invoices" ADD COLUMN IF NOT EXISTS "qty" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_order_invoices" DROP COLUMN IF EXISTS "qty"`,
    );
  }
}
