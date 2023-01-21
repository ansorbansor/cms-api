import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { SPK } from './spk.entity';

@Entity({ name: 'spk_inhouse_teams' })
export class SPKInhouseTeam extends EntityHelper {
  @Column()
  spk_id?: number;

  @Column()
  user_id?: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  userInhouse: User;

  @OneToOne(() => SPK)
  @JoinColumn({ name: 'spk_id' })
  spk: SPK;
}
