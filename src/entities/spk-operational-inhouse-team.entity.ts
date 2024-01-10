import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { SPKOperational } from './spk-operationals.entity';

@Entity({ name: 'spk_operational_inhouse_teams' })
export class SPKOperationalInhouseTeam extends EntityHelper {
  @Column()
  spk_operational_id?: number;

  @Column()
  user_id?: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  userInhouse: User;

  @OneToOne(() => SPKOperational)
  @JoinColumn({ name: 'spk_operational_id' })
  spk_operational: SPKOperational;
}
