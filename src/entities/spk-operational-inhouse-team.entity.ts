import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { SPKOperational } from './spk-operationals.entity';

@Entity({ name: 'spk_operational_inhouse_teams' })
export class SPKOperationalInhouseTeam extends EntityHelper {
  @Column()
  spk_operational_id?: number;

  @Column()
  user_id?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  userInhouse: User;

  @ManyToOne(() => SPKOperational)
  @JoinColumn({ name: 'spk_operational_id' })
  spk_operational: SPKOperational;
}
