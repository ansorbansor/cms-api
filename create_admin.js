const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function run() {
    console.log("Generating password hash...");
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash('Password9', salt);

    console.log("Connecting to database...");
    const client = new Client({
        host: '127.0.0.1',
        port: 5433,
        user: 'postgres',
        password: 'postgres@123!qaz',
        database: 'biosron-simpro'
    });

    await client.connect();

    try {
        console.log("Checking Superadmin Position...");
        let res = await client.query(`SELECT id FROM employee_positions WHERE name = 'Superadmin Position'`);
        let posId;
        if (res.rows.length === 0) {
            console.log("Inserting Superadmin Position...");
            res = await client.query(`INSERT INTO employee_positions (name, code, grant_all_access, "created_at", "updated_at") VALUES ('Superadmin Position', 'SA', true, NOW(), NOW()) RETURNING id`);
        }
        posId = res.rows[0].id;

        console.log("Checking Roles...");
        let roleRes = await client.query(`SELECT id FROM role WHERE id = 1`).catch(e => ({rows: []}));
        if(roleRes.rows.length === 0) {
            await client.query(`INSERT INTO role (id, name, "created_at", "updated_at") VALUES (1, 'Super Admin', NOW(), NOW())`).catch(e => console.log("Role issue", e.message));
        }

        console.log("Temporarily dropping NOT NULL constraint on files.user_id...");
        await client.query(`ALTER TABLE "files" ALTER COLUMN "user_id" DROP NOT NULL`).catch(e => {});

        console.log("Inserting dummy photo...");
        let fileRes = await client.query(`SELECT id FROM "files" LIMIT 1`).catch(e => ({rows: []}));
        let photoId;
        if(fileRes.rows.length === 0) {
            let insertFile = await client.query(`INSERT INTO "files" (name, file_type, path, extension, description, "created_at", "updated_at") VALUES ('dummy.jpg', 1, 'dummy.jpg', 'jpg', 'photo', NOW(), NOW()) RETURNING id`);
            photoId = insertFile.rows[0].id;
        } else {
            photoId = fileRes.rows[0].id;
        }

        console.log("Inserting user...");
        const userRes = await client.query(`SELECT id FROM users WHERE email = 'john.tor@example.com'`);
        let userId;
        if(userRes.rows.length === 0) {
            const insertRes = await client.query(`
                INSERT INTO users (nik, name, email, password, provider, employee_position_id, status, "created_at", "updated_at", photo, phone) 
                VALUES ('1', 'John Tor', 'john.tor@example.com', $1, 'email', $2, true, NOW(), NOW(), $3, '1234567890')
                RETURNING id
            `, [hash, posId, photoId]);
            userId = insertRes.rows[0].id;
            console.log("Admin user 'john.tor@example.com' created successfully!");
        } else {
            userId = userRes.rows[0].id;
            await client.query(`
                UPDATE users SET password = $1, employee_position_id = $2 WHERE email = 'john.tor@example.com'
            `, [hash, posId]);
            console.log("Admin user 'john.tor@example.com' updated successfully!");
        }

        console.log("Assigning user to file...");
        await client.query(`UPDATE "files" SET user_id = $1 WHERE id = $2`, [userId, photoId]).catch(e => console.log(e.message));

        console.log("Assigning role...");
        let userRoleRes = await client.query(`SELECT * FROM "user_role" WHERE "userId" = $1 AND "roleId" = $2`, [userId, 1])
            .catch(e => ({rows: []}));
        if(userRoleRes && userRoleRes.rows.length === 0) {
            await client.query(`INSERT INTO "user_role" ("userId", "roleId") VALUES ($1, $2)` , [userId, 1])
                .catch(e => console.log("User role issue: ", e.message));
        }
        
    } catch (e) {
        console.error("FATAL ERROR: ", e);
    } finally {
        await client.end();
        console.log("Done.");
    }
}

run();
