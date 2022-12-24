import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

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
  total_range?: number;

  @Column()
  check_in_photo?: number;

  @Column()
  check_out_photo?: number;

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
  created_by?: number;

  @Column()
  approved_by?: number;

  @Column()
  approve_over_budget_by?: number;

  @Column()
  paid_by?: number;

  @Column()
  closed_by?: number;
}
