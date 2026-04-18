const { Client } = require('pg');
async function f() {
  const client = new Client({ user: 'postgres', password: 'postgres@123!qaz', host: 'localhost', port: 5433, database: 'biosron-simpro' });
  await client.connect();
  const res = await client.query("SELECT id FROM employee_positions WHERE code = 'superadmin' LIMIT 1");
  const positionId = res.rows[0].id;
  await client.query("UPDATE users SET employee_position_id = $1 WHERE email = 'ansorbansor@gmail.com'", [positionId]);
  console.log('Set ansorbansor@gmail.com to Superadmin Position:', positionId);
  await client.end();
}
f();
