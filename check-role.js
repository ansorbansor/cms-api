const { Client } = require('pg');

async function debugRoleAccess() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const menus = await client.query(`SELECT * FROM menus WHERE id = 10`);
    console.log('Menu 10:', menus.rows[0]);

    const roleAccess = await client.query(`SELECT * FROM role_access WHERE employee_position_id = 9 AND menu_id = 10`);
    console.log('Role Access for RPM (9) to Menu 10:', roleAccess.rows);

    const allAccess = await client.query(`SELECT menu_id FROM role_access WHERE employee_position_id = 9`);
    console.log('All Menu IDs for RPM (9):', allAccess.rows.map(r => r.menu_id));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debugRoleAccess();
