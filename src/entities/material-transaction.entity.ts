import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Material } from './material.entity';
import { User } from './user.entity';

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
