const { Client } = require('pg');

async function debug() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const q = await client.query(`SELECT id, name, email, region, gm_region FROM users WHERE (region ILIKE '%SOUTH%' OR gm_region ILIKE '%SOUTH%') AND deleted_at IS NULL`);
    console.table(q.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debug();
