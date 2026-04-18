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
    const csvData = fs.readFileSync('D:/Android/SIMPRO Update 25 Nov 26/employee_positions_202604021138.csv', 'utf8');
    const lines = csvData.trim().split(/\r?\n/).slice(1); // skip header
    const now = new Date();

    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Parse CSV line simply
      const parts = line.split(',');
      
      const created_at = parts[0] || now;
      const updated_at = parts[1] || now;
      const deleted_at = parts[2] || null;
      const id = parseInt(parts[3]);
      
      let name = parts[4] ? parts[4].replace(/^"|"$/g, '') : null;
      if (name === '') name = null;
      
      let grant_all_access = null;
      if (parts[5] === 'true' || parts[5] === 'false') {
          grant_all_access = parts[5] === 'true';
      } else if (parts[5]) {
          grant_all_access = parts[5].replace(/^"|"$/g, '') === 'true';
      }
      
      let code = parts[6] ? parts[6].replace(/^"|"$/g, '') : null;
      if (code === '') code = null;

      // insert into DB with ON CONFLICT (id) DO UPDATE
      await client.query(
        `INSERT INTO employee_positions (id, code, grant_all_access, created_at, updated_at, deleted_at, name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
            code = EXCLUDED.code,
            grant_all_access = EXCLUDED.grant_all_access,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at,
            name = EXCLUDED.name`,
        [
          id, 
          code,
          grant_all_access !== null ? grant_all_access : false,
          new Date(created_at),
          new Date(updated_at),
          deleted_at ? new Date(deleted_at) : null,
          name
        ]
      );
    }
    console.log("Successfully imported employee_positions from new CSV.");
  } catch (e) {
    console.error("Error importing:", e);
  } finally {
    await client.end();
  }
}

run();
