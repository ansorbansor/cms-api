import {
  AfterLoad,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Region } from './region.entity';
import { Transportation } from './transportation.entity';
import { User } from './user.entity';
import { Site } from './site.entity';
import { Area } from './area.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { SPKInhouseTeam } from './spk-inhouse-team.entity';
import { FileEntity } from './file.entity';
import { SPKCostEvidence } from './spk-cost-evidence.entity';
import moment from 'moment';
import { SPKCategory } from './spk-category.entity';
import { Customer } from './customer.entity';
import { SPKSubCategory } from './spk-subcategory.entity';

@Entity({ name: 'spk' })
export class SPK extends EntityHelper {
  @Column({ nullable: true })
  spk_number?: string;

  @Column({ nullable: true })
  status?: number;

  @Column({ nullable: true })
  region_id?: number;

  @Column({ nullable: true })
  transportation_id?: number;

  @Column({ nullable: true })
  police_number?: string;

  @Column({ nullable: true })
  cash_advance?: number;

  @Column({ nullable: true })
  pay_to_user_id?: number;

  @Column({ nullable: true })
  site_id?: number;

  @Column({ nullable: true })
  area_id?: number;

  @Column({ nullable: true })
  distance?: string;

  @Column({ nullable: true })
  work_type?: string;

  @Column({ nullable: true })
  po_id?: number;

  @Column({ nullable: true })
  distance_to_site_photo?: number;

  @Column({ nullable: true })
  remark_inhouse_team?: string;

  @Column({ nullable: true })
  km_range_start_photo?: number;

  @Column({ nullable: true })
  km_range_end_photo?: number;

  @Column({ nullable: true })
  km_back_to_office_photo?: number;

  @Column({ nullable: true })
  total_range?: number;

  @Column({ nullable: true })
  check_in_photo?: number;

  @Column({ nullable: true })
  check_out_photo?: number;

  @Column({ nullable: true })
  transfer_proof_photo?: number;

  @Column({ nullable: true })
  closing_date?: Date;

  @Column({ nullable: true })
  operation_cost?: number;

  @Column({ nullable: true })
  delta_of_settlement?: number;

  @Column({ nullable: true })
  cashback?: number;

  @Column({ nullable: true })
  cashout?: number;

  @Column({ nullable: true })
  remark_admin?: string;

  @Column({ nullable: true })
  remark_verificator?: string;

  @Column({ nullable: true })
  created_by?: number;

  @Column({ nullable: true })
  approved_by?: number;

  @Column({ nullable: true })
  approved_over_budget_by?: number;

  @Column({ nullable: true })
  paid_by?: number;

  @Column({ nullable: true })
  closed_by?: number;

  @Column({ nullable: true })
  remark_pm?: string;

  @Column({ nullable: true })
  remark_rpm?: string;

  @Column({ nullable: true })
  category_id?: number;

  @Column({ nullable: true })
  subcategory_id?: number;

  @Column({ nullable: true })
  is_over_budget?: boolean;

  @Column({ nullable: true })
  remark_superadmin?: string;

  @Column({ nullable: true })
  customer_id?: number;

  @OneToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @OneToOne(() => Transportation)
  @JoinColumn({ name: 'transportation_id' })
  transportation: Transportation;

  @OneToOne(() => User)
  @JoinColumn({ name: 'pay_to_user_id' })
  pay_to_user: User;

  @OneToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @OneToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @OneToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'po_id' })
  po: PurchaseOrder;

  @OneToMany(() => SPKInhouseTeam, (spk) => spk.spk)
  @JoinColumn()
  inhouse_team: SPKInhouseTeam[];

  @OneToMany(() => Area, (area) => area.areaPO)
  @JoinColumn()
  related_po: PurchaseOrder[];

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'distance_to_site_photo' })
  distance_to_site_file: FileEntity;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'km_range_start_photo' })
  km_range_start_file: FileEntity;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'km_range_end_photo' })
  km_range_end_file: FileEntity;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'km_back_to_office_photo' })
  km_back_to_office_file: FileEntity;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'check_in_photo' })
  check_in_file: FileEntity;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'check_out_photo' })
  check_out_file: FileEntity;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'transfer_proof_photo' })
  transfer_proof_file: FileEntity;

  @OneToMany(() => SPKCostEvidence, (costEvidence) => costEvidence.spk)
  @JoinColumn()
  cost_evidences: SPKCostEvidence[];

  @OneToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approved_by_user: User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'approved_over_budget_by' })
  approved_over_budget_by_user: User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'paid_by' })
  paid_by_user: User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'closed_by' })
  closed_by_user: User;

  @OneToOne(() => SPKCategory)
  @JoinColumn({ name: 'category_id' })
  category: SPKCategory;

  @OneToOne(() => SPKSubCategory)
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: SPKSubCategory;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ select: false, insert: false, readonly: true, nullable: true })
  total_cash_advance: number;

  @Column({ select: false, insert: false, readonly: true, nullable: true })
  total_po_unit_price: number;

  @BeforeInsert()
  async setSPKNumber() {
    this.spk_number = `SPK-${moment(new Date()).format(
      'yyyyMMD',
    )}-${new Date().valueOf()}`;
  }

  @Column({ nullable: true })
  paid_date: Date;
  paidDateParseDate: string;

  @AfterLoad()
  setEntityName() {
    this.paidDateParseDate = this.paid_date
      ? moment(this.paid_date).format('YYYY-MM-DD HH:mm:ss')
      : null;
    this.__entity = this.constructor.name;
  }
}
