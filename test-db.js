const { createConnection } = require('typeorm');
const config = require('./ormconfig.js');

async function run() {
  const connection = await createConnection(config);
  const result = await connection.query('SELECT id, invoice_number, position, purchase_order_id FROM purchase_order_invoices WHERE purchase_order_id = 393');
  console.log('RESULT:', result);
  process.exit(0);
}

run().catch(console.error);
