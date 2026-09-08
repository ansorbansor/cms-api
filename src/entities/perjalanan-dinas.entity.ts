import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { FileEntity } from './file.entity';

@Entity({ name: 'perjalanan_dinas' })
export class PerjalananDinas extends EntityHelper {
  @Column()
  destination_city: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column({ type: 'text' })
  purpose: string;

  @Column({ default: 'Draft' })
  status: string;

  @Column({ nullable: true })
  user_id: number;

  @Column({ nullable: true })
  project_name: string;

  @Column({ nullable: true })
  attachment_id: number;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'attachment_id' })
  attachment?: FileEntity;
}
