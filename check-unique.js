const { Client } = require('pg');
async function f() {
  const client = new Client({ user: 'postgres', password: 'postgres@123!qaz', host: 'localhost', port: 5433, database: 'biosron-simpro' });
  await client.connect();
  const res = await client.query(`
    SELECT tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'users' AND tc.constraint_type = 'UNIQUE';
  `);
  console.log(res.rows);
  await client.end();
}
f();
