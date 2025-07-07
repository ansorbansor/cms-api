import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { Transform } from 'class-transformer';

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

  @Column()
  @Transform(({ value }) => value === 1)
  forgot_admin: boolean;
}
