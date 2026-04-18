const { Client } = require('pg');
const c = new Client({user: 'postgres', password: 'postgres@123!qaz', host: 'localhost', port: 5433, database: 'biosron-simpro'});
c.connect().then(() => {
  return c.query("SELECT pg_get_constraintdef(c.oid) AS constraint_def, t.relname AS table_name FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE c.conname = 'UQ_97672ac88f789774dd47f7c8be3'");
}).then(r => console.log(r.rows)).finally(()=>c.end()).catch(console.error);
