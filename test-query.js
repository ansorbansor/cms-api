const { createConnection } = require('typeorm');
const ormconfig = require('./ormconfig.json');

async function checkQuery() {
  const connection = await createConnection(ormconfig);
  const ticketRepo = connection.getRepository('WorkloadTicket');
  
  const project_id = '1549'; // Test an arbitrary project ID
  
  const qb = ticketRepo.createQueryBuilder('wt')
    .leftJoinAndSelect('wt.site', 'site')
    .leftJoinAndSelect('wt.purchase_orders', 'purchase_orders')
    .leftJoinAndSelect('purchase_orders.customer', 'customer')
    .leftJoinAndSelect('purchase_orders.project', 'project')
    .where('wt.is_template = false')
    .orderBy('wt.created_at', 'DESC')
    .skip(0)
    .take(10);
    
  if (project_id) {
    qb.andWhere('purchase_orders.project_id = :projectId', { projectId: project_id });
  }

  console.log("SQL Query:");
  console.log(qb.getSql());
  
  try {
    const [data, total] = await qb.getManyAndCount();
    console.log('Result data length:', data.length);
    console.log('Total count:', total);
  } catch (e) {
    console.error('Error executing query:', e);
  }
  
  await connection.close();
}

checkQuery();
