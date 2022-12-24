import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'spk_inhouse_teams' })
export class SPKInhouseTeam extends EntityHelper {
  @Column()
  spk_id?: number;

  @Column()
  user_id?: number;
}
