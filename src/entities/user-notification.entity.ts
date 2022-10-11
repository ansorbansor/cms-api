import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';

@Entity({ name: 'user_notifications' })
export class UserNotification extends EntityHelper {
  @Column()
  user_id?: number;

  @Column()
  title?: string;

  @Column()
  description?: string;

  @Column()
  type?: number;

  @Column()
  status?: number;

  @Column()
  source?: number;

  @Column()
  extra_data?: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
