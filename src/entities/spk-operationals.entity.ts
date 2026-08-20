import {
  AfterLoad,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Region } from './region.entity';
import { User } from './user.entity';
import { Area } from './area.entity';
import { FileEntity } from './file.entity';
import moment from 'moment';
import { SPKOperationalInhouseTeam } from './spk-operational-inhouse-team.entity';
import { SPKOperationalCostEvidence } from './spk-operationals.cost-evidence.entity';
import { SPKOperationalCategory } from './spk-operational-category.entity';
import { Customer } from './customer.entity';
import { SPKOperationalRequestType } from './spk-operational-request-type.entity';
import { SPKOperationalSubCategory } from './spk-operational-subcategory.entity';

@Entity({ name: 'spk_operationals' })
export class SPKOperational extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  spk_number?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  status?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  region_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  spk_operational_request_type_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  spk_operational_category_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  spk_operational_subcategory_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  cash_advance?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  pay_to_user_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  area_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  description?: string;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  customer_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  remark_pm?: string;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  remark_rpm?: string;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  remark_verificator?: string;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  remark_admin?: string;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  remark_superadmin?: string;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  remark_inhouse_team?: string;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  closing_date?: Date;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  paid_date?: Date;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  operation_cost?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  delta_of_settlement?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  cashback?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  cashout?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  created_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  approved_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  approved_over_budget_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  paid_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  closed_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  approved_date?: Date;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  approved_over_budget_date?: Date;

  @ApiProperty({ example: 'Test' })
  @Column({ nullable: true })
  transfer_proof_photo?: number;

  @Column({ nullable: true })
  is_over_budget?: boolean;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'pay_to_user_id' })
  pay_to_user: User;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @OneToMany(() => SPKOperationalInhouseTeam, (spk) => spk.spk_operational)
  @JoinColumn()
  inhouse_team: SPKOperationalInhouseTeam[];

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'transfer_proof_photo' })
  transfer_proof_file: FileEntity;

  @OneToMany(
    () => SPKOperationalCostEvidence,
    (costEvidence) => costEvidence.spk_operational,
  )
  @JoinColumn()
  cost_evidences: SPKOperationalCostEvidence[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approved_by_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_over_budget_by' })
  approved_over_budget_by_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'paid_by' })
  paid_by_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closed_by' })
  closed_by_user: User;

  @ManyToOne(() => SPKOperationalCategory)
  @JoinColumn({ name: 'spk_operational_category_id' })
  category: SPKOperationalCategory;

  @ManyToOne(() => SPKOperationalSubCategory)
  @JoinColumn({ name: 'spk_operational_subcategory_id' })
  subcategory: SPKOperationalSubCategory;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => SPKOperationalRequestType)
  @JoinColumn({ name: 'spk_operational_request_type_id' })
  request_type: SPKOperationalRequestType;

  @BeforeInsert()
  async setSPKNumber() {
    this.spk_number = `SPKO-${moment(new Date()).format(
      'yyyyMMD',
    )}-${new Date().valueOf()}`;
  }

  paidDateParseDate: string;
  approvedDateParseDate: string;
  approvedOverBudgetDateParseDate: string;

  @AfterLoad()
  setSPKOperationalDates() {
    this.paidDateParseDate = this.paid_date
      ? moment(this.paid_date).format('YYYY-MM-DD HH:mm:ss')
      : null;
    this.approvedDateParseDate = this.approved_date
      ? moment(this.approved_date).format('YYYY-MM-DD HH:mm:ss')
      : null;
    this.approvedOverBudgetDateParseDate = this.approved_over_budget_date
      ? moment(this.approved_over_budget_date).format('YYYY-MM-DD HH:mm:ss')
      : null;
    this.__entity = this.constructor.name;
  }
}
