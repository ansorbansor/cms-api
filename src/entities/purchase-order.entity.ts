import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { Region } from './region.entity';
import { Project } from './project.entity';
import { Area } from './area.entity';
import { Operator } from './operator.entity';
import { Customer } from './customer.entity';
import { Site } from './site.entity';
import { BiddingArea } from './bidding_area.entity';
import { RemarkProject } from './remark-project.entity';
import { StatusAcceptance } from './status-acceptance.entity';
import { PendingType } from './pending-type.entity';
import { PD } from './pd.entity';
import { PurchaseOrderInvoice } from './purchase-order-invoice.entity';
import { WorkloadTicket } from './workload-ticket.entity';

@Entity({ name: 'purchase_orders' })
export class PurchaseOrder extends EntityHelper {
  @Column({ nullable: true })
  user_id: number;

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  line_po_status: number;

  @Column({ nullable: true })
  line_po_number: string;

  @Column({ nullable: true })
  po_number: string;

  @Column({ nullable: true })
  shipment_number: string;

  @Column({ nullable: true })
  region_id: number;

  @Column({ nullable: true })
  area_id: number;

  @Column({ nullable: true })
  operator_id: number;

  @Column({ nullable: true })
  customer_id: number;

  @Column({ nullable: true })
  project_id: number;

  @Column({ nullable: true })
  site_id: number;

  @Column({ nullable: true })
  workload_ticket_id: number;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  item_code: string;

  @Column({ nullable: true })
  item_description: string;

  @Column({ type: 'float', nullable: true })
  unit_price: number;

  @Column({ type: 'float', nullable: true })
  unit_price_1: number;

  @Column({ type: 'float', nullable: true })
  unit_price_2: number;

  @Column({ type: 'float', nullable: true })
  requested_qty: number;

  @Column({ type: 'float', nullable: true })
  billed_qty: number;

  @Column({ type: 'float', nullable: true })
  due_qty: number;

  @Column({ type: 'float', nullable: true })
  line_amount: number;

  @Column({ type: 'float', nullable: true })
  remaining_from_po: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  payment_terms: string;

  @Column({ nullable: true })
  bidding_area_id: number;

  @Column({ nullable: true })
  publish_date?: Date;

  @Column({ nullable: true })
  start_date?: Date;

  @Column({ nullable: true })
  end_date?: Date;

  @Column({ nullable: true })
  priority_esar_approve: string;

  @Column({ nullable: true })
  remark_weekly: string;

  @Column({ nullable: true })
  remark_project_id: number;

  @Column({ nullable: true })
  status_acceptance_id: number;

  @Column({ nullable: true })
  pending_type_id: number;

  @Column({ nullable: true })
  pending_approval_pd: string;

  @Column({ type: 'float', nullable: true })
  amount_pending_approval_pd: number;

  @Column({ nullable: true })
  pd_id: number;

  @Column({ nullable: true })
  actual_completion_date?: Date;

  @Column({ nullable: true })
  ready_invoice: string;

  @Column({ type: 'float', nullable: true })
  amount_ready_invoice: number;

  @Column({ nullable: true })
  remark_highlight: string;

  @Column({ type: 'float', nullable: true })
  budget_percentage: number;

  @Column({ type: 'float', nullable: true })
  total_acceptance: number;

  @Column({ type: 'float', nullable: true })
  ny_invoice: number;

  @Column({ type: 'float', nullable: true })
  ny_invoice_date?: Date;

  @Column({ type: 'float', nullable: true })
  piutang: number;

  @Column({ nullable: true })
  priority_site_list: string;

  @Column({ type: 'float', nullable: true })
  amount_priority: number;

  @Column({ type: 'float', nullable: true })
  achievement_priority: number;

  @Column({ nullable: true })
  actual_work_date?: Date;

  @Column({ type: 'float', nullable: true })
  actual_work_amount: number;

  @Column({ nullable: true })
  actual_work_status: string;

  @Column({ nullable: true })
  remark_ss: string;

  @Column({ nullable: true })
  remark_highlight_recon: string;

  @Column({ nullable: true })
  pic: number;

  @Column({ nullable: true })
  plan_date: Date;

  @Column({ nullable: true })
  start_progress?: Date;

  @Column({ nullable: true })
  finish_progress?: Date;

  @Column({ nullable: true })
  done_atp?: Date;

  @Column({ nullable: true })
  start_progress_confirmed_by_rpm?: string;

  @Column({ nullable: true })
  finish_progress_confirmed_by_rpm?: string;

  @Column({ nullable: true })
  done_atp_confirmed_by_rpm?: string;

  @Column({ nullable: true })
  remark_rpm?: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @ManyToOne(() => Operator)
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @ManyToOne(() => BiddingArea)
  @JoinColumn({ name: 'bidding_area_id' })
  bidding_area: BiddingArea;

  @ManyToOne(() => RemarkProject)
  @JoinColumn({ name: 'remark_project_id' })
  remark_project: RemarkProject;

  @ManyToOne(() => StatusAcceptance)
  @JoinColumn({ name: 'status_acceptance_id' })
  status_acceptance: StatusAcceptance;

  @ManyToOne(() => PendingType)
  @JoinColumn({ name: 'pending_type_id' })
  pending_type: PendingType;

  @ManyToOne(() => PD)
  @JoinColumn({ name: 'pd_id' })
  pd: PD;

  @OneToMany(() => PurchaseOrderInvoice, (po_invoice) => po_invoice.po)
  @JoinColumn()
  po_invoice?: PurchaseOrderInvoice[];

  @ManyToOne(() => WorkloadTicket, (wt) => wt.purchase_orders)
  @JoinColumn({ name: 'workload_ticket_id' })
  workload_ticket?: WorkloadTicket;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'pic' })
  pic_data?: User;

  @Column({ type: 'float', select: false, insert: false, readonly: true, nullable: true })
  total_cash_advance: number;
}
