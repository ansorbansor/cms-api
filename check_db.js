const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

client.connect().then(async () => {
  const res = await client.query(`
    SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'perjalanan_dinas';
  `);
  console.log('TABLE perjalanan_dinas:');
  console.table(res.rows);
  client.end();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
