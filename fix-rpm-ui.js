const { Client } = require('pg');

async function fixRPMRoleAccess() {
  const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
  await client.connect();
  try {
    const accessResult = await client.query('SELECT * FROM role_access WHERE employee_position_id = 9 AND menu_id = 10');
    if (accessResult.rowCount === 0) {
      // maybe menu_access is boolean or string or int. Let's use true or 1.
      await client.query(`INSERT INTO role_access (employee_position_id, menu_id, menu_access) VALUES (9, 10, '1')`);
      console.log('Granted Menu 10 access to RPM');
    } else {
      console.log('RPM already has access to Menu 10');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixRPMRoleAccess();
