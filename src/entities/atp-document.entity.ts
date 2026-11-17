import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AtpTemplate } from './atp-template.entity';
import { Project } from './project.entity';
import { Customer } from './customer.entity';
import { Site } from './site.entity';
import { User } from './user.entity';
import { AtpDocumentValue } from './atp-document-value.entity';
import { AtpDocumentReview } from './atp-document-review.entity';

@Entity({ name: 'atp_documents' })
export class AtpDocument extends EntityHelper {
  @ApiProperty({ example: 'ATP-2026-0001' })
  @Column({ unique: true })
  doc_number: string;

  @ApiProperty({ example: 1 })
  @Column()
  template_id: number;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  project_id: number;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  customer_id: number;

  @ApiProperty({ example: 'SUM-SS-PLG-8272/SUM-SS-PLG-0541' })
  @Column({ nullable: true })
  link_id: string;

  @ApiProperty({ example: 'SF_Megaria_COLLECTOR / Duku Palembang' })
  @Column({ nullable: true })
  link_name: string;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  site_id_ne: number;

  @ApiProperty({ example: 2 })
  @Column({ nullable: true })
  site_id_fe: number;

  @ApiProperty({ example: '2026-09-17' })
  @Column({ type: 'date', nullable: true })
  atp_date: Date;

  @ApiProperty({ example: 'DRAFT' })
  @Column({ default: 'DRAFT' })
  status: string; // 'DRAFT' | 'INTERNAL_REVIEW' | 'CUSTOMER_REVIEW' | 'APPROVED' | 'PASS_WITH_PUNCHLIST' | 'REVISE' | 'REJECTED'

  @ApiProperty({ example: 'PASS' })
  @Column({ nullable: true })
  acceptance_status: string; // 'PASS' | 'PASS WITH PUNCHLIST' | 'REJECT'

  @ApiProperty({ example: { major_count: 0, minor_count: 1 } })
  @Column({ type: 'jsonb', nullable: true })
  punchlist_summary: any;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  created_by: number;

  @ApiProperty({ example: '2026-09-17T10:00:00Z' })
  @Column({ nullable: true, type: 'timestamp with time zone' })
  submitted_at: Date;

  @ApiProperty({ example: '2026-09-18T10:00:00Z' })
  @Column({ nullable: true, type: 'timestamp with time zone' })
  approved_at: Date;

  @ApiProperty({ example: 'sec_token_abc123' })
  @Column({ nullable: true, unique: true })
  share_token: string;

  @ManyToOne(() => AtpTemplate, (template) => template.documents)
  @JoinColumn({ name: 'template_id' })
  template: AtpTemplate;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id_ne' })
  site_ne: Site;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id_fe' })
  site_fe: Site;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => AtpDocumentValue, (val) => val.document, { cascade: true })
  values: AtpDocumentValue[];

  @OneToMany(() => AtpDocumentReview, (rev) => rev.document, { cascade: true })
  reviews: AtpDocumentReview[];
}
