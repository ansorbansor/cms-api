const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'biosron-simpro',
  password: 'postgres@123!qaz',
  port: 5433,
});

const files = [
  { path: 'D:/Android/SIMPRO Update 25 Nov 26/spk_category_202604021204.csv', table: 'spk_category' },
  { path: 'D:/Android/SIMPRO Update 25 Nov 26/spk_operational_categories_202604021204.csv', table: 'spk_operational_categories' },
  { path: 'D:/Android/SIMPRO Update 25 Nov 26/spk_operational_subcategories_202604021204.csv', table: 'spk_operational_subcategories' },
  { path: 'D:/Android/SIMPRO Update 25 Nov 26/spk_subcategory_202604021204.csv', table: 'spk_subcategory' }
];

async function run() {
  try {
    await client.connect();

    for (const file of files) {
      console.log(`Importing ${file.table}...`);
      const csvData = fs.readFileSync(file.path, 'utf8');
      const lines = csvData.trim().split(/\r?\n/);
      if (lines.length < 2) continue;

      const header = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      const now = new Date();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        let parts = [];
        let cur = '';
        let inQuotes = false;
        for (let char of line) { // Simple CSV parse skipping commas in quotes
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                parts.push(cur);
                cur = '';
            } else {
                cur += char;
            }
        }
        parts.push(cur);

        let row = {};
        for(let c = 0; c < header.length; c++) {
            row[header[c]] = parts[c] ? parts[c].replace(/^"|"$/g, '') : null;
        }

        const id = parseInt(row['id']);
        const name = row['name'] || null;
        const created_at = row['created_at'] || now;
        const updated_at = row['updated_at'] || now;
        const deleted_at = row['deleted_at'] || null;

        await client.query(
          `INSERT INTO ${file.table} (id, name, created_at, updated_at, deleted_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              created_at = EXCLUDED.created_at,
              updated_at = EXCLUDED.updated_at,
              deleted_at = EXCLUDED.deleted_at`,
          [
            id, 
            name,
            new Date(created_at),
            new Date(updated_at),
            deleted_at ? new Date(deleted_at) : null
          ]
        );
      }
      console.log(`Successfully imported ${file.table}.`);
    }
  } catch (e) {
    console.error("Error importing:", e);
  } finally {
    await client.end();
  }
}

run();
