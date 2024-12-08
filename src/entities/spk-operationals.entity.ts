import {
  AfterLoad,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
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
  @Column()
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
  @Column()
  customer_id?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  remark_pm?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  remark_rpm?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  remark_verificator?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  remark_admin?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  remark_superadmin?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  remark_inhouse_team?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  closing_date?: Date;

  @ApiProperty({ example: 'Test' })
  @Column()
  paid_date?: Date;

  @ApiProperty({ example: 'Test' })
  @Column()
  operation_cost?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  delta_of_settlement?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  cashback?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  cashout?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  created_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  approved_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  approved_over_budget_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  paid_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  closed_by?: number;

  @ApiProperty({ example: 'Test' })
  @Column()
  transfer_proof_photo?: number;

  @Column()
  is_over_budget?: boolean;

  @OneToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @OneToOne(() => User)
  @JoinColumn({ name: 'pay_to_user_id' })
  pay_to_user: User;

  @OneToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @OneToMany(() => SPKOperationalInhouseTeam, (spk) => spk.spk_operational)
  @JoinColumn()
  inhouse_team: SPKOperationalInhouseTeam[];

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'transfer_proof_photo' })
  transfer_proof_file: FileEntity;

  @OneToMany(
    () => SPKOperationalCostEvidence,
    (costEvidence) => costEvidence.spk_operational,
  )
  @JoinColumn()
  cost_evidences: SPKOperationalCostEvidence[];

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

  @OneToOne(() => SPKOperationalCategory)
  @JoinColumn({ name: 'spk_operational_category_id' })
  category: SPKOperationalCategory;

  @OneToOne(() => SPKOperationalSubCategory)
  @JoinColumn({ name: 'spk_operational_subcategory_id' })
  subcategory: SPKOperationalSubCategory;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToOne(() => SPKOperationalRequestType)
  @JoinColumn({ name: 'spk_operational_request_type_id' })
  request_type: SPKOperationalRequestType;

  @BeforeInsert()
  async setSPKNumber() {
    this.spk_number = `SPKO-${moment(new Date()).format(
      'yyyyMMD',
    )}-${new Date().valueOf()}`;
  }

  paidDateParseDate: string;

  @AfterLoad()
  setEntityName() {
    this.paidDateParseDate = this.paid_date
      ? moment(this.paid_date).format('YYYY-MM-DD HH:mm:ss')
      : null;
    this.__entity = this.constructor.name;
  }
}
