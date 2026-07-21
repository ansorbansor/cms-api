import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepository } from 'typeorm';
import { Milestone } from './src/entities/milestone.entity';
import { WorkloadTicket } from './src/entities/workload-ticket.entity';

async function bootstrap() {
  console.log('Bootstrapping app context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('App context loaded.');

  const milestoneRepo = getRepository(Milestone);
  const ticketRepo = getRepository(WorkloadTicket);

  console.log('Fetching Completed milestones...');
  const milestones = await milestoneRepo.find({
    where: { status: 'Completed' },
    relations: ['tasks', 'workload_ticket']
  });

  let count = 0;
  for (const m of milestones) {
    if (!m.tasks || m.tasks.length === 0) continue;
    const hasUnfinished = m.tasks.some(t => t.status !== 'Completed' && t.status !== 'No Need');
    if (hasUnfinished) {
      console.log(`Milestone ${m.id} (${m.name}) has unfinished tasks. Reverting to Active.`);
      m.status = 'Active';
      await milestoneRepo.save(m);
      
      if (m.workload_ticket && m.workload_ticket.status === 'Completed') {
         console.log(`Reverting Ticket ${m.workload_ticket.id} to In Progress.`);
         m.workload_ticket.status = 'In Progress';
         await ticketRepo.save(m.workload_ticket);
      }
      count++;
    }
  }
  
  // Also check 'Confirmed Finished' milestones?
  const confirmedMilestones = await milestoneRepo.find({
    where: { status: 'Confirmed Finished' },
    relations: ['tasks', 'workload_ticket']
  });
  
  let countConfirmed = 0;
  for (const m of confirmedMilestones) {
    if (!m.tasks || m.tasks.length === 0) continue;
    const hasUnfinished = m.tasks.some(t => t.status !== 'Completed' && t.status !== 'No Need');
    if (hasUnfinished) {
      console.log(`Milestone ${m.id} (${m.name}) (Confirmed Finished) has unfinished tasks. Reverting to Active.`);
      m.status = 'Active';
      await milestoneRepo.save(m);
      
      if (m.workload_ticket && (m.workload_ticket.status === 'Completed' || m.workload_ticket.status === 'Confirmed Finished')) {
         console.log(`Reverting Ticket ${m.workload_ticket.id} to In Progress.`);
         m.workload_ticket.status = 'In Progress';
         await ticketRepo.save(m.workload_ticket);
      }
      countConfirmed++;
    }
  }

  console.log(`Fixed ${count} 'Completed' milestones.`);
  console.log(`Fixed ${countConfirmed} 'Confirmed Finished' milestones.`);
  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
