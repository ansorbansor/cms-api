import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';

@Entity({ name: 'activity_logs' })
export class ActivityLog extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  description: string;

  @Column()
  ip: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
