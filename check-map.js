const { Client } = require('pg');
async function f() {
  const client = new Client({ user: 'postgres', password: 'postgres@123!qaz', host: 'localhost', port: 5433, database: 'biosron-simpro' });
  await client.connect();
  const getEpId = async (name) => { const r = await client.query('SELECT id, code FROM employee_positions WHERE name ILIKE $1 LIMIT 1', [name]); return r.rows[0] ? r.rows[0].id : null; };
  const getEpIdByCode = async (code) => { const r = await client.query('SELECT id, name FROM employee_positions WHERE code ILIKE $1 LIMIT 1', [code]); return r.rows[0] ? r.rows[0].id : null; };
  
  const getMenuId = async (name) => { const r = await client.query('SELECT id FROM menus WHERE name ILIKE $1 LIMIT 1', ['%' + name + '%']); return r.rows[0] ? r.rows[0].id : null; };

  console.log('NEXT_PUBLIC_CREATE_SPK_ACCESS=' + (await getMenuId('Create SPK / BOP')));
  console.log('NEXT_PUBLIC_KM_RANGE_ACCESS=' + (await getMenuId('KM Range')));
  console.log('NEXT_PUBLIC_CREATE_KASBON_SETTLEMENT_ACCESS=' + (await getMenuId('Kasbon')));
  console.log('NEXT_PUBLIC_CREATE_COST_EVIDENCE_ACCESS=' + (await getMenuId('Cost Evidence')));
  
  console.log('NEXT_PUBLIC_PM_POSITION=' + (await getEpIdByCode('pm') || await getEpId('PM')));
  console.log('NEXT_PUBLIC_RPM_POSITION=' + (await getEpIdByCode('rpm') || await getEpId('RPM')));
  console.log('NEXT_PUBLIC_VERIFICATOR_POSITION=' + (await getEpIdByCode('verificator') || await getEpId('Verificator')));
  console.log('NEXT_PUBLIC_ADMIN_KEUANGAN_REGIONAL=' + (await getEpIdByCode('adminpaymentregion') || await getEpId('Admin Keuangan Region')));
  
  console.log('NEXT_PUBLIC_ACCESS_CREATE_EDIT_USER=' + (await getMenuId('Create/Edit User')));
  console.log('NEXT_PUBLIC_ACCESS_CREATE_EDIT_PO=' + (await getMenuId('Create/Edit PO')));
  
  console.log('NEXT_PUBLIC_ESAR_POSITION=' + (await getEpIdByCode('esar_admin') || await getEpId('ESAR Admin')));
  console.log('NEXT_PUBLIC_INVOICE_ADMIN_POSITION=' + (await getEpIdByCode('invoice_admin') || await getEpId('Invoice Admin')));
  
  await client.end();
}
f();
