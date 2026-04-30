const { Client } = require('pg');

async function fixPiutang() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'biosron-simpro',
    password: 'postgres@123!qaz',
    port: 5433,
  });
  await client.connect();

  try {
    console.log('Running Piutang sync...');
    const result = await client.query(`
      UPDATE purchase_orders
      SET piutang = COALESCE((
          SELECT SUM(COALESCE(approve_amount, 0)) - SUM(COALESCE(payment_amount, 0))
          FROM purchase_order_invoices
          WHERE purchase_order_invoices.purchase_order_id = purchase_orders.id
      ), 0)
      WHERE piutang IS NULL 
         OR piutang != COALESCE((
             SELECT SUM(COALESCE(approve_amount, 0)) - SUM(COALESCE(payment_amount, 0))
             FROM purchase_order_invoices
             WHERE purchase_order_invoices.purchase_order_id = purchase_orders.id
         ), 0);
    `);
    console.log(`Successfully updated ${result.rowCount} POs with correct piutang logic.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixPiutang();
