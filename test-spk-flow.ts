import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SPKService } from './src/modules/spk/spk.service';
import { UsersService } from './src/modules/users/users.service';
import { getManager } from 'typeorm';

async function runTest() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const spkService = app.get(SPKService);
  const usersService = app.get(UsersService);

  try {
    console.log('--- STARTING SPK TEST ---');
    // 1. Find a Superadmin user (they have all accesses)
    // 1. Get a PM user and an RPM user
    const pmUsers = await getManager().query(`
      SELECT u.id, u.email FROM users u 
      JOIN employee_positions ep ON ep.id = u.employee_position_id 
      JOIN role_access ra ON ra.employee_position_id = ep.id
      JOIN menus m ON m.id = ra.menu_id
      WHERE m.name = 'spk_over_budget' LIMIT 1
    `);
    const pmUser = await usersService.findOneFull({ id: pmUsers[0].id });
    console.log(`Using PM User: ${pmUser.email}`);

    const rpmUsers = await getManager().query(`
      SELECT u.id, u.email FROM users u 
      JOIN employee_positions ep ON ep.id = u.employee_position_id 
      JOIN role_access ra ON ra.employee_position_id = ep.id
      JOIN menus m ON m.id = ra.menu_id
      WHERE m.name = 'spk_approve' LIMIT 1
    `);
    const rpmUser = await usersService.findOneFull({ id: rpmUsers[0].id });
    console.log(`Using RPM User: ${rpmUser.email}`);

    // 2. Find a PO and Site
    const pos = await getManager().query(`SELECT id, site_id FROM purchase_orders WHERE deleted_at IS NULL LIMIT 1`);
    if (pos.length === 0) throw new Error("No PO found");
    const poId = pos[0].id;
    const siteId = pos[0].site_id;

    // 3. Test RPM Approval (Status 0 -> 2)
    console.log('\n--- TESTING RPM BULK APPROVAL ---');
    const rpmInsert = await getManager().query(`
      INSERT INTO spk (status, is_over_budget, cash_advance, site_id, po_id, created_by, spk_number, created_at, updated_at) 
      VALUES (0, true, 999999999, $1, $2, $3, 'SPK-TEST-RPM', NOW(), NOW()) RETURNING id
    `, [siteId, poId, rpmUser.id]);
    const rpmSpkId = rpmInsert[0].id;
    console.log(`Created SPK for RPM ID: ${rpmSpkId}`);

    try {
      await spkService.approveMany([rpmSpkId], rpmUser, '127.0.0.1');
      console.log('Bulk approve RPM SUCCESS! SPK is now APPROVED (2).');
    } catch (e) {
      console.error('Bulk approve RPM FAILED:', e.response || e.message);
    }
    
    let checkRpm = await getManager().query(`SELECT status, is_over_budget FROM spk WHERE id = $1`, [rpmSpkId]);
    console.log('SPK State after RPM approve:', checkRpm[0]);

    // 4. Test PM Approval (Status 2 -> 3)
    console.log('\n--- TESTING PM BULK APPROVAL ---');
    const pmInsert = await getManager().query(`
      INSERT INTO spk (status, is_over_budget, cash_advance, site_id, po_id, created_by, spk_number, created_at, updated_at) 
      VALUES (2, true, 999999999, $1, $2, $3, 'SPK-TEST-PM', NOW(), NOW()) RETURNING id
    `, [siteId, poId, pmUser.id]);
    const pmSpkId = pmInsert[0].id;
    console.log(`Created SPK for PM ID: ${pmSpkId}`);

    try {
      await spkService.approveMany([pmSpkId], pmUser, '127.0.0.1');
      console.log('Bulk approve PM SUCCESS! SPK is now APPROVED_OVER_BUDGET (3).');
    } catch (e) {
      console.error('Bulk approve PM FAILED:', e.response || e.message);
    }

    let checkPm = await getManager().query(`SELECT status, is_over_budget FROM spk WHERE id = $1`, [pmSpkId]);
    console.log('SPK State after PM approve:', checkPm[0]);

  } catch (e) {
    console.error(e);
  }

  await app.close();
}
runTest();
