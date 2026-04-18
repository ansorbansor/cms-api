const { Client } = require('pg');

async function fixPhotos() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'biosron-simpro',
    password: 'postgres@123!qaz',
    port: 5433,
  });
  await client.connect();

  try {
    console.log('Cleaning up dangling photo references in users table...');
    const result = await client.query(`
      UPDATE users 
      SET photo = NULL 
      WHERE photo IS NOT NULL AND photo NOT IN (SELECT id FROM files)
    `);
    console.log(`Updated ${result.rowCount} users with dangling photo IDs.`);
  } catch (err) {
    console.error('Error fixing photos:', err);
  } finally {
    await client.end();
  }
}

fixPhotos();
