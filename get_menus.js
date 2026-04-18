const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'biosron-simpro',
  password: 'postgres@123!qaz',
  port: 5433,
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM menus;');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
