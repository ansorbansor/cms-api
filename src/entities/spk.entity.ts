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
  @Column()
  spk_number?: string;

  @Column()
  status?: number;

  @Column()
  region_id?: number;

  @Column()
  transportation_id?: number;

  @Column()
  police_number?: string;

  @Column()
  cash_advance?: number;

  @Column()
  pay_to_user_id?: number;

  @Column()
  site_id?: number;

  @Column()
  area_id?: number;

  @Column()
  distance?: number;

  @Column()
  work_type?: string;

  @Column()
  po_id?: number;

  @Column()
  distance_to_site_photo?: number;

  @Column()
  remark_inhouse_team?: string;

  @Column()
  km_range_start_photo?: number;

  @Column()
  km_range_end_photo?: number;

  @Column()
  km_back_to_office_photo?: number;

  @Column()
  total_range?: number;

  @Column()
  check_in_photo?: number;

  @Column()
  check_out_photo?: number;

  @Column()
  transfer_proof_photo?: number;

  @Column()
  closing_date?: Date;

  @Column()
  operation_cost?: number;

  @Column()
  delta_of_settlement?: number;

  @Column()
  cashback?: number;

  @Column()
  cashout?: number;

  @Column()
  remark_admin?: string;

  @Column()
  remark_verificator?: string;

  @Column()
  created_by?: number;

  @Column()
  approved_by?: number;

  @Column()
  approved_over_budget_by?: number;

  @Column()
  paid_by?: number;

  @Column()
  closed_by?: number;

  @Column()
  remark_pm?: string;

  @Column()
  remark_rpm?: string;

  @Column()
  category_id?: number;

  @Column()
  subcategory_id?: number;

  @Column()
  is_over_budget?: boolean;

  @Column()
  remark_superadmin?: string;

  @Column()
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

  @OneToOne(() => SPKCategory)
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: SPKSubCategory;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ select: false, insert: false, readonly: true })
  total_cash_advance: number;

  @Column({ select: false, insert: false, readonly: true })
  total_po_unit_price: number;

  @BeforeInsert()
  async setSPKNumber() {
    this.spk_number = `SPK-${moment(new Date()).format(
      'yyyyMMD',
    )}-${new Date().valueOf()}`;
  }

  @Column()
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
