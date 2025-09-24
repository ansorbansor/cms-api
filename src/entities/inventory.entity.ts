import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FileEntity } from './file.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tool_name', nullable: true, type: 'varchar' })
  toolName?: string | null;

  @Column({ name: 'tool_condition', nullable: true, type: 'varchar' })
  toolCondition?: string | null;

  @Column({ nullable: true, type: 'double precision' })
  latitude?: number | null;

  @Column({ nullable: true, type: 'double precision' })
  longitude?: number | null;

  // Relations to FileEntity for photos
  @Column({ name: 'tool_photo_id', nullable: true })
  tool_photo_id?: number | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'tool_photo_id' })
  tool_photo_file?: FileEntity | null;

  @Column({ name: 'serial_number_photo_id', nullable: true })
  serial_number_photo_id?: number | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'serial_number_photo_id' })
  serial_number_photo_file?: FileEntity | null;

  @Column({ name: 'user_id', nullable: true })
  userId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt?: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date | null;

  // Optional soft delete column if you want to implement soft deletes
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;
}
