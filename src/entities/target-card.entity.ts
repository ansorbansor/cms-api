import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('target_cards')
export class TargetCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'json' })
  items: any;

  @Column({ type: 'date', nullable: true })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
