const { Client } = require('pg');
const fs = require('fs');

async function checkRPM() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const spkQuery = await client.query(`SELECT * FROM spk WHERE spk_number = $1`, ['SPK-2026042-1775108434187']);
    const spk = spkQuery.rows[0];
    const regionQuery = await client.query(`SELECT * FROM regions WHERE id = $1`, [spk.region_id]);
    const region = regionQuery.rows[0];

    const rpmQuery = await client.query(`
      SELECT u.id, u.name, u.email, u.region, u.gm_region
      FROM users u
      LEFT JOIN employee_positions ep ON u.employee_position_id = ep.id
      WHERE ep.name ILIKE '%RPM%' AND u.deleted_at IS NULL
    `);
    
    fs.writeFileSync('rpm-output.json', JSON.stringify({
      spkRegion: region ? region.name : null,
      rpms: rpmQuery.rows
    }, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkRPM();
