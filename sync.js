const { Client } = require('pg');
const fs = require('fs');

async function sync() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'biosron-simpro',
    password: 'postgres@123!qaz',
    port: 5433,
  });
  await client.connect();

  try {
    // 1. Get constraint name
    const res = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'users' AND kcu.column_name = 'employee_position_id';
    `);
    
    // We expect one FK constraint
    const constraintName = res.rows[0]?.constraint_name;
    if (constraintName) {
      console.log('Dropping FK:', constraintName);
      await client.query(`ALTER TABLE users DROP CONSTRAINT "${constraintName}"`);
    }

    console.log('Deleting employee_positions and role_access...');
    await client.query('DELETE FROM role_access');
    await client.query('DELETE FROM employee_positions');

    console.log('Restarting sequences...');
    await client.query('ALTER SEQUENCE employee_positions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE role_access_id_seq RESTART WITH 1');

    console.log('Executing production employee_positions...');
    const epSql = fs.readFileSync('../employee_positions_202604071545.sql', 'utf8');
    await client.query(epSql);

    console.log('Executing production role_access...');
    const raSql = fs.readFileSync('../role_access_202604071545.sql', 'utf8');
    await client.query(raSql);

    if (constraintName) {
      console.log('Restoring FK:', constraintName);
      await client.query(`ALTER TABLE users ADD CONSTRAINT "${constraintName}" FOREIGN KEY (employee_position_id) REFERENCES employee_positions(id)`);
    }

    console.log('Done mapping production roles to local DB!');
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await client.end();
  }
}

sync();
