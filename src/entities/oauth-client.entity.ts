import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';

@Entity({ name: 'oauth_clients' })
export class OauthClient extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  name: string;

  @Column()
  secret: string;

  @Column()
  revoked: number;

  @OneToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  userData?: User;
}
