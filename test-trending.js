const { createConnection } = require('typeorm');
const ormconfig = require('./ormconfig.json');

async function checkTrending() {
  const connection = await createConnection(ormconfig);
  const taskRepo = connection.getRepository('WorkloadTask');
  
  const qb = taskRepo.createQueryBuilder('task')
    .select(`DATE_TRUNC('month', task.updated_at)`, 'date')
    .addSelect('COUNT(DISTINCT task.id)', 'count')
    .addSelect('task.name', 'taskName')
    .innerJoin('task.milestone', 'milestone')
    .innerJoin('milestone.workload_ticket', 'workload_ticket')
    .leftJoin('workload_ticket.purchase_orders', 'purchase_orders')
    .leftJoin('purchase_orders.customer', 'customer')
    .leftJoin('purchase_orders.project', 'project')
    .where('task.status = :status', { status: 'Completed' })
    .andWhere('workload_ticket.is_template = false')
    .andWhere('task.updated_at IS NOT NULL');

  // Let's get all unique completed task names
  const allTasks = await taskRepo.createQueryBuilder('task').select('DISTINCT task.name', 'name').where("task.status = 'Completed'").getRawMany();
  if (allTasks.length === 0) {
    console.log("No completed tasks found.");
    await connection.close();
    return;
  }
  
  const testName = allTasks[0].name;
  console.log("Testing with task name:", testName);
  
  qb.andWhere('task.name IN (:...namesArray)', { namesArray: [testName] });
  
  qb.groupBy(`DATE_TRUNC('month', task.updated_at)`)
    .addGroupBy('task.name')
    .orderBy(`DATE_TRUNC('month', task.updated_at)`, 'ASC');

  try {
    const data = await qb.getRawMany();
    console.log('Result length:', data.length);
    console.log('Sample Data:', data);
  } catch (e) {
    console.error('Error executing query:', e);
  }
  
  await connection.close();
}

checkTrending();
