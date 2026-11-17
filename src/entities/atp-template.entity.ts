import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { AtpTemplateSection } from './atp-template-section.entity';
import { AtpDocument } from './atp-document.entity';

@Entity({ name: 'atp_templates' })
export class AtpTemplate extends EntityHelper {
  @ApiProperty({ example: 'PT. XLSMART Microwave Acceptance Test (Template v4.1)' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Official template for Microwave dual-end ATP' })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  project_id: number;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  customer_id: number;

  @ApiProperty({ example: 'dual_end' })
  @Column({ default: 'dual_end' })
  structure_type: string; // 'dual_end' | 'single_site'

  @ApiProperty({ example: '1.0' })
  @Column({ default: '1.0' })
  version: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  created_by: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => AtpTemplateSection, (section) => section.template, { cascade: true })
  sections: AtpTemplateSection[];

  @OneToMany(() => AtpDocument, (doc) => doc.template)
  documents: AtpDocument[];
}
