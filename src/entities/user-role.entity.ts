import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity({ name: 'user_roles' })
export class UserRoles extends EntityHelper {
  @Column()
  user_id?: number;

  @Column()
  role_id?: number;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Role, {
    eager: true,
  })
  @JoinColumn({ name: 'role_id' })
  role?: Role;
}
