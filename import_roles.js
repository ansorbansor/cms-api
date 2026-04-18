const { Client } = require('pg');
const fs = require('fs');

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
    
    // Read the CSV
    const csvData = fs.readFileSync('D:/Android/SIMPRO Update 25 Nov 26/role_access_202604021102.csv', 'utf8');
    const lines = csvData.trim().split(/\r?\n/).slice(1); // skip header
    const now = new Date();
    
    // Truncate table first to avoid conflicts
    await client.query('TRUNCATE TABLE role_access RESTART IDENTITY CASCADE;');

    for (const line of lines) {
      if (!line.trim()) continue;
      // Split by comma
      const parts = line.split(',');
      if (parts.length < 7) continue;

      const created_at = parts[0] || now;
      const updated_at = parts[1] || now;
      const deleted_at = parts[2] || null;
      const id = parseInt(parts[3]);
      const employee_position_id = parseInt(parts[4]);
      const menu_id = parseInt(parts[5]);
      const menu_access = parseInt(parts[6]);

      // insert into DB
      try {
        await client.query(
          `INSERT INTO role_access (id, created_at, updated_at, deleted_at, employee_position_id, menu_id, menu_access)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id, 
            new Date(created_at),
            new Date(updated_at),
            deleted_at ? new Date(deleted_at) : null,
            employee_position_id,
            menu_id,
            menu_access
          ]
        );
      } catch (e) {
        console.error(`Error importing row ${id}:`, e.message);
      }
    }
    console.log("Successfully imported role_access from CSV.");
  } catch (e) {
    console.error("Error importing:", e);
  } finally {
    await client.end();
  }
}

run();
