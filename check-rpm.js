const { Client } = require('pg');

async function checkRPM() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const spkQuery = await client.query(`SELECT * FROM spk WHERE spk_number = $1`, ['SPK-2026042-1775108434187']);
    const spk = spkQuery.rows[0];
    if (!spk) {
      console.log('SPK not found');
    } else {
      console.log('SPK Found:', spk);
      const poQuery = await client.query(`SELECT * FROM purchase_orders WHERE id = $1`, [spk.purchase_order_id]);
      const po = poQuery.rows[0];
      if (po) console.log('PO Found:', po);

      const siteId = spk.site_id || po?.site_id;
      let site;
      if (siteId) {
        const siteQuery = await client.query(`SELECT * FROM sites WHERE id = $1`, [siteId]);
        site = siteQuery.rows[0];
        if (site) console.log('Site Found:', site);
      }
    }
    
    // Fetch users who are RPM
    const rpmQuery = await client.query(`
      SELECT u.id, u.name, u.email, u.region, u.gm_region, u.project, ep.name as role
      FROM users u
      LEFT JOIN employee_positions ep ON u.employee_position_id = ep.id
      WHERE ep.name ILIKE '%RPM%' AND u.deleted_at IS NULL
    `);
    console.log('RPM Users found:');
    console.table(rpmQuery.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkRPM();
