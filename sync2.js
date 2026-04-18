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
    console.log('Truncating users with CASCADE (This will wipe relational data)...');
    await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    console.log('Deleting employee_positions and role_access...');
    await client.query('DELETE FROM role_access');
    await client.query('DELETE FROM employee_positions');

    console.log('Restarting sequences...');
    await client.query('ALTER SEQUENCE employee_positions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE role_access_id_seq RESTART WITH 1');

    console.log('Relaxing NOT NULL constraints...');
    await client.query('ALTER TABLE employee_positions ALTER COLUMN updated_at DROP NOT NULL');
    await client.query('ALTER TABLE role_access ALTER COLUMN updated_at DROP NOT NULL');
    await client.query('ALTER TABLE users ALTER COLUMN updated_at DROP NOT NULL');

    console.log('Relaxing UNIQUE constraints on users...');
    const uqRes = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      WHERE tc.table_name = 'users' AND tc.constraint_type = 'UNIQUE';
    `);
    for (let uq of uqRes.rows) {
      await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${uq.constraint_name}"`);
    }

    console.log('Suspending Foreign Key checks...');
    await client.query("SET session_replication_role = 'replica';");
    
    console.log('Executing production employee_positions...');
    const epSql = fs.readFileSync('../employee_positions_202604071703.sql', 'utf8');
    await client.query(epSql);

    console.log('Executing production role_access...');
    const raSql = fs.readFileSync('../role_access_202604071703.sql', 'utf8');
    await client.query(raSql);

    console.log('Executing production users...');
    const usersSql = fs.readFileSync('../users_202604071703.sql', 'utf8');
    await client.query(usersSql);

    console.log('Re-enabling Foreign Key checks...');
    await client.query("SET session_replication_role = 'origin';");

    console.log('Cleaning up dangling menu references in role_access...');
    await client.query('DELETE FROM role_access WHERE menu_id NOT IN (SELECT id FROM menus)');

    console.log('Done mapping production roles and users to local DB!');
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await client.end();
  }
}

sync();
