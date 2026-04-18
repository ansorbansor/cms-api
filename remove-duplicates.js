const { Client } = require('pg');

async function removeDuplicates() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'biosron-simpro',
    password: 'postgres@123!qaz',
    port: 5433,
  });
  await client.connect();

  try {
    console.log('Removing duplicated rows based on email...');
    const resultEmail = await client.query(`
      DELETE FROM users
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id ASC) as row_num
          FROM users
          WHERE email IS NOT NULL AND email != ''
        ) t
        WHERE t.row_num > 1
      );
    `);
    console.log(`Deleted ${resultEmail.rowCount} rows with duplicate emails.`);

    console.log('Removing duplicated rows based on nik...');
    const resultNik = await client.query(`
      DELETE FROM users
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY nik ORDER BY id ASC) as row_num
          FROM users
          WHERE nik IS NOT NULL AND nik != ''
        ) t
        WHERE t.row_num > 1
      );
    `);
    console.log(`Deleted ${resultNik.rowCount} rows with duplicate niks.`);

    console.log('Done cleaning duplicates!');
  } catch (err) {
    console.error('Error removing duplicates:', err);
  } finally {
    await client.end();
  }
}

removeDuplicates();
