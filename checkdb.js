const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@123!qaz@127.0.0.1:5433/biosron-simpro',
  });
  
  try {
    await client.connect();
    
    // Find all position names
    const res = await client.query(`
      SELECT * FROM employee_positions
    `);
    
    console.log("All positions row:", JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

test();
