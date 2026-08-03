import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Site } from './site.entity';
import { User } from './user.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Milestone } from './milestone.entity';

@Entity({ name: 'workload_tickets' })
export class WorkloadTicket extends EntityHelper {
  @Column({ nullable: true })
  ticket_id: string;

  @Column({ type: 'boolean', default: false })
  is_template: boolean;

  @Column({ nullable: true })
  template_name: string;

  @Column({ nullable: true })
  site_id: number;

  @Column({ nullable: true })
  created_by: number;

  @Column({ nullable: true })
  status: string; // Pending, In Progress, Completed

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @OneToMany(() => PurchaseOrder, (po: PurchaseOrder) => po.workload_ticket)
  purchase_orders: PurchaseOrder[];

  @OneToMany(() => Milestone, (milestone: Milestone) => milestone.workload_ticket)
  milestones: Milestone[];
}
