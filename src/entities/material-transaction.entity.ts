import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Material } from './material.entity';
import { User } from './user.entity';
import { FileEntity } from './file.entity';

@Entity({ name: 'material_transactions' })
export class MaterialTransaction extends EntityHelper {
  @ApiProperty({ example: 'OUT' })
  @Column()
  transaction_type: string; // IN or OUT

  @ApiProperty({ example: 100 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 'JKT-0912' })
  @Column({ nullable: true })
  site_id: string;

  @ApiProperty({ example: 'Deployed to site' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: 'John Doe' })
  @Column({ nullable: true })
  receiver_name: string;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  receiver_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @ApiProperty({ example: 123 })
  @Column({ nullable: true })
  confirmation_photo: number;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'confirmation_photo' })
  photoFile: FileEntity;

  @ApiProperty({ example: -6.2088 })
  @Column({ type: 'double precision', nullable: true })
  lat: number;

  @ApiProperty({ example: 106.8456 })
  @Column({ type: 'double precision', nullable: true })
  lng: number;

  @ManyToOne(() => Material, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column()
  material_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by' })
  user: User;

  @Column({ nullable: true })
  performed_by: number;
}
