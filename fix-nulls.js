const { Client } = require('pg');

async function fixNulls() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'biosron-simpro',
    password: 'postgres@123!qaz',
    port: 5433,
  });
  await client.connect();

  try {
    console.log('Fixing NULL updated_at fields so TypeORM can add NOT NULL...');
    await client.query('UPDATE employee_positions SET updated_at = created_at WHERE updated_at IS NULL');
    await client.query('UPDATE role_access SET updated_at = created_at WHERE updated_at IS NULL');
    await client.query('UPDATE users SET updated_at = created_at WHERE updated_at IS NULL');

    console.log('Done mapping NULL values!');
  } catch (err) {
    console.error('Error fixing nulls:', err);
  } finally {
    await client.end();
  }
}

fixNulls();
