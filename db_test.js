const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'biosron-simpro',
  password: 'postgres@123!qaz',
  port: 5433,
});

async function run() {
  await client.connect();
  
  const res1 = await client.query('SELECT * FROM files ORDER BY id DESC LIMIT 5');
  console.log('Latest Files:', res1.rows);

  const res2 = await client.query('SELECT id, email, employee_position_id FROM users LIMIT 5');
  console.log('Users:', res2.rows);

  const res3 = await client.query('SELECT * FROM perjalanan_dinas LIMIT 5');
  console.log('Perjalanan Dinas:', res3.rows);

  await client.end();
}

run().catch(console.error);
