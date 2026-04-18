const { Client } = require('pg');

async function debugNIK() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const q = await client.query(`
      SELECT 
        u.id, u.name, u.email, u.nik, u.region, u.gm_region, u.employee_position_id,
        ep.name as position_name, ep.code as position_code
      FROM users u
      LEFT JOIN employee_positions ep ON u.employee_position_id = ep.id
      WHERE u.nik = $1 OR u.name ILIKE '%Bernad Simamora%'
    `, ['1212012812890001']);
    
    console.log(q.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debugNIK();
