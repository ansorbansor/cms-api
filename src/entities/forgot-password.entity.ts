import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';

@Entity()
export class ForgotPassword extends EntityHelper {
  @Allow()
  @Column()
  @Index()
  hash: string;

  @Allow()
  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  userData: User;

  ip: string;
}
