import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { FileEntity } from './file.entity';
import { SPKOperational } from './spk-operationals.entity';

@Entity({ name: 'spk_operational_cost_evidences' })
export class SPKOperationalCostEvidence extends EntityHelper {
  @Column()
  spk_operational_id?: number;

  @Column()
  name?: string;

  @Column()
  cost?: number;

  @Column()
  photo?: number;

  @ManyToOne(() => SPKOperational)
  @JoinColumn({ name: 'spk_operational_id' })
  spk_operational: SPKOperational;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'photo' })
  cost_evidence_photo_file: FileEntity;
}
