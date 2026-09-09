const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'biosron-simpro',
  password: 'postgres@123!qaz',
  port: 5433,
});

async function run() {
  await client.connect();
  const query = `
    CREATE TABLE IF NOT EXISTS workload_ticket_po_history (
      id SERIAL PRIMARY KEY,
      workload_ticket_id INT NOT NULL,
      po_id INT NOT NULL,
      action VARCHAR(255),
      old_amount NUMERIC(20, 2),
      new_amount NUMERIC(20, 2),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    );
  `;
  await client.query(query);
  console.log('Table created or already exists.');
  await client.end();
}

run().catch(console.error);
