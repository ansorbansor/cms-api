const { Client } = require('pg');

async function checkRPM() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const spkQuery = await client.query(`SELECT * FROM spk WHERE spk_number = $1`, ['SPK-2026042-1775108434187']);
    const spk = spkQuery.rows[0];
    const regionQuery = await client.query(`SELECT * FROM regions WHERE id = $1`, [spk.region_id]);
    const region = regionQuery.rows[0];

    console.log(`SPK Region: ${region ? region.name : 'Unknown'}`);

    const rpmQuery = await client.query(`
      SELECT u.id, u.name, u.email, u.region, u.gm_region
      FROM users u
      LEFT JOIN employee_positions ep ON u.employee_position_id = ep.id
      WHERE ep.name ILIKE '%RPM%' AND u.deleted_at IS NULL
    `);
    
    console.log(`\nRPMs that might match Region ${region?.name}:`);
    rpmQuery.rows.forEach(u => {
        console.log(`- ${u.name} (${u.email}) | Region: ${u.region} | GM Region: ${u.gm_region}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkRPM();
