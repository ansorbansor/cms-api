import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { SPK } from './spk.entity';
import { FileEntity } from './file.entity';

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

  @OneToOne(() => SPK)
  @JoinColumn({ name: 'spk_id' })
  spk: SPK;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'photo' })
  photoFile: FileEntity;
}
