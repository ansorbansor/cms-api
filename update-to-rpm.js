const { Client } = require('pg');

async function fixNIK() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    // 9 is the ID for RPM
    await client.query(`UPDATE users SET employee_position_id = 9 WHERE nik = '1212012812890001'`);
    console.log('Fixed User Position to RPM');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixNIK();
