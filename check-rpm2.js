const { Client } = require('pg');

async function checkRPM() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const spkQuery = await client.query(`SELECT * FROM spk WHERE spk_number = $1`, ['SPK-2026042-1775108434187']);
    const spk = spkQuery.rows[0];
    if (!spk) {
      console.log('SPK not found');
      return;
    }
    console.log('--- SPK Info ---');
    console.log(`ID: ${spk.id}`);
    console.log(`Region ID: ${spk.region_id}`);
    console.log(`Project: ${spk.project}`);

    const rpmQuery = await client.query(`
      SELECT u.id, u.name, u.email, u.region, u.gm_region, u.project, ep.name as role
      FROM users u
      LEFT JOIN employee_positions ep ON u.employee_position_id = ep.id
      WHERE ep.name ILIKE '%RPM%' AND u.deleted_at IS NULL
    `);
    console.log('\n--- RPM Users ---');
    rpmQuery.rows.forEach(u => {
        console.log(`User ID: ${u.id} | Name: ${u.name} | Region: ${u.region} | GM Region: ${u.gm_region} | Project: ${u.project}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkRPM();
