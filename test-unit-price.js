const { createConnection } = require('typeorm');
const ormconfig = require('./ormconfig.json');

async function testQuery() {
  const connection = await createConnection(ormconfig);
  const taskRepo = connection.getRepository('WorkloadTask');

  const truncString = 'month';
  const qb = taskRepo.createQueryBuilder('task')
    .select(`DATE_TRUNC('${truncString}', task.updated_at)`, 'date')
    .addSelect('COUNT(DISTINCT task.id)', 'count')
    .addSelect('task.name', 'taskName')
    .addSelect('COALESCE(SUM(purchase_orders.unit_price), 0)', 'totalUnitPrice')
    .innerJoin('task.milestone', 'milestone')
    .innerJoin('milestone.workload_ticket', 'workload_ticket')
    .leftJoin('workload_ticket.purchase_orders', 'purchase_orders')
    .where('task.status = :status', { status: 'Completed' })
    .andWhere('workload_ticket.is_template = false')
    .andWhere('task.updated_at IS NOT NULL')
    .groupBy(`DATE_TRUNC('${truncString}', task.updated_at)`)
    .addGroupBy('task.name')
    .orderBy(`DATE_TRUNC('${truncString}', task.updated_at)`, 'ASC')
    .take(10); // just limit to see output

  console.log(qb.getSql());
  const result = await qb.getRawMany();
  console.log(result.slice(0, 5));

  await connection.close();
}

testQuery();
