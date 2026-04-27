import * as fs from 'fs';
import { createConnection } from 'typeorm';

async function test() {
  const raw = fs.readFileSync('ormconfig.json', 'utf8');
  const config = JSON.parse(raw);
  config.entities = ['src/entities/*.entity.ts'];
  
  const connection = await createConnection(config);
  try {
    const res = await connection.query("SELECT t.id, t.name, t.status, u.phone, u.name as user_name FROM workload_tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.status='In Progress'");
    console.log("IN PROGRESS TASKS:", res);
  } catch (e) {
    console.error("DB error:", e);
  } finally {
    await connection.close();
  }
}

test();
