const { Client } = require('pg');
const client = new Client({user: 'postgres', host: '127.0.0.1', database: 'biosron-simpro', password: 'postgres@123!qaz', port: 5433});

(async () => {
    try {
        await client.connect();
        const pos = await client.query("SELECT id, name FROM employee_positions WHERE name = 'SS'");
        console.log('Position:', pos.rows);
        if(pos.rows.length > 0) {
            const roles = await client.query('SELECT r.*, m.name as menu_name FROM role_access r LEFT JOIN menus m ON r.menu_id = m.id WHERE r.employee_position_id = $1', [pos.rows[0].id]);
            console.log('Roles Count:', roles.rows.length);
            console.log('Sample Roles:', roles.rows.slice(0, 5));
            const menusCount = await client.query('SELECT COUNT(*) FROM menus');
            console.log('Menus Count:', menusCount.rows);
        }
    } catch(e) {
        console.error(e)
    } finally {
        await client.end();
    }
})()
