import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'spk_cost_evidences' })
export class SPKCostEvidence extends EntityHelper {
  @Column()
  spk_id?: number;

  @Column()
  name?: string;

  @Column()
  cost?: number;

  @Column()
  photo?: number;
}
