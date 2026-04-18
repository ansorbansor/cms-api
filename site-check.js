const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433 });
client.connect().then(() => client.query(`SELECT COUNT(*) FROM sites;`)).then(res => { console.log("SITES COUNT:", res.rows[0]); client.end() }).catch(e => console.error(e));
