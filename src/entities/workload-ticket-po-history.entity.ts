import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { WorkloadTicket } from './workload-ticket.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { User } from './user.entity';

@Entity({ name: 'workload_ticket_po_history' })
export class WorkloadTicketPoHistory extends EntityHelper {
  @Column({ nullable: false })
  workload_ticket_id: number;

  @Column({ nullable: false })
  po_id: number;

  @Column({ nullable: true })
  action: string; // 'Attached', 'Detached', 'Amount Updated'

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  old_amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  new_amount: number;

  @Column({ nullable: true })
  created_by: number;

  @ManyToOne(() => WorkloadTicket)
  @JoinColumn({ name: 'workload_ticket_id' })
  workload_ticket: WorkloadTicket;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'po_id' })
  purchase_order: PurchaseOrder;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;
}
