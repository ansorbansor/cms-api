const { Client } = require('pg');
const fs = require('fs');

async function debug() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const q = await client.query(`SELECT id, name, email, region, gm_region FROM users WHERE (region ILIKE '%SOUTH%' OR gm_region ILIKE '%SOUTH%') AND deleted_at IS NULL`);
    fs.writeFileSync('south-users.json', JSON.stringify(q.rows, null, 2));

    const spkQuery = await client.query(`SELECT id, spk_number, region_id, area_id FROM spk WHERE spk_number = $1`, ['SPK-2026042-1775108434187']);
    console.log('SPK from DB:', spkQuery.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debug();
