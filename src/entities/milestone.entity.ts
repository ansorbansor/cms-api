import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { WorkloadTicket } from './workload-ticket.entity';
import { WorkloadTask } from './workload-task.entity';

@Entity({ name: 'milestones' })
export class Milestone extends EntityHelper {
  @Column({ nullable: true })
  workload_ticket_id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  order_index: number;

  @Column({ nullable: true })
  status: string; // Pending, Active, Completed

  @ManyToOne(() => WorkloadTicket, (wt: WorkloadTicket) => wt.milestones)
  @JoinColumn({ name: 'workload_ticket_id' })
  workload_ticket: WorkloadTicket;

  @OneToMany(() => WorkloadTask, (task: WorkloadTask) => task.milestone)
  tasks: WorkloadTask[];
}
