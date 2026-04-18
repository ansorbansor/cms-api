const { Client } = require('pg');

async function debugRegionsAndAreas() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const spkQuery = await client.query(`SELECT id, spk_number, region_id, area_id FROM spk WHERE spk_number = $1`, ['SPK-2026042-1775108434187']);
    const spk = spkQuery.rows[0];
    
    if (spk) {
      console.log('SPK found:', spk);
      const r = await client.query('SELECT name FROM regions WHERE id = $1', [spk.region_id]);
      console.log('SPK Region Name:', r.rows[0]?.name);
      
      const a = await client.query('SELECT name FROM areas WHERE id = $1', [spk.area_id]);
      console.log('SPK Area Name:', a.rows[0]?.name);
    } else {
      console.log('SPK not found!');
    }

    // list all regions matching south sumatera
    console.log('\nSearch for south sumatera in regions:');
    const rSearch = await client.query(`SELECT id, name FROM regions WHERE name ILIKE '%south%' OR name ILIKE '%sumat%'`);
    console.table(rSearch.rows);

    // list all areas matching south sumatera
    console.log('\nSearch for south sumatera in areas:');
    const aSearch = await client.query(`SELECT id, name FROM areas WHERE name ILIKE '%south%' OR name ILIKE '%sumat%'`);
    console.table(aSearch.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debugRegionsAndAreas();
