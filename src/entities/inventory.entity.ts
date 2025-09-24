import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn, // ✅ Added DeleteDateColumn
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

  @Column({ type: 'text', nullable: true })
  remark?: string | null; // ✅ CHANGED: Matched type to nullable setting

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

  // ✅ CHANGED: Timestamps are no longer nullable and use a more robust type
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // ✅ CHANGED: Switched to the correct decorator for soft deletes
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date | null;
}