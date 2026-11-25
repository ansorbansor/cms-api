import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'leave_quotas' })
export class LeaveQuota extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 12 })
  total_quota: number;

  @Column({ type: 'int', default: 0 })
  used_quota: number;

  @Column({ type: 'int', default: 12 })
  remaining_quota: number;

  @Column({ type: 'text', nullable: true })
  adjustment_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
