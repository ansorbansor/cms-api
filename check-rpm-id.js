const { Client } = require('pg');

async function fixNIK() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const rpmQ = await client.query(`SELECT id, name, code FROM employee_positions WHERE name ILIKE '%RPM%' OR code ILIKE '%RPM%'`);
    console.log('Available RPM Positions in DB:');
    console.table(rpmQ.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixNIK();
