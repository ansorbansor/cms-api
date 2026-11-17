import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AtpTemplate } from './atp-template.entity';
import { AtpTemplateItem } from './atp-template-item.entity';

@Entity({ name: 'atp_template_sections' })
export class AtpTemplateSection extends EntityHelper {
  @ApiProperty({ example: 1 })
  @Column()
  template_id: number;

  @ApiProperty({ example: '1. Site Information' })
  @Column()
  title: string;

  @ApiProperty({ example: 'site_info' })
  @Column()
  section_key: string;

  @ApiProperty({ example: 'info_table' })
  @Column()
  section_type: string; // 'info_table' | 'checklist' | 'photo_grid' | 'asset_tagging' | 'attachment_grid'

  @ApiProperty({ example: 1 })
  @Column({ default: 0 })
  order_index: number;

  @ApiProperty({ example: 'Description' })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @ManyToOne(() => AtpTemplate, (template) => template.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: AtpTemplate;

  @OneToMany(() => AtpTemplateItem, (item) => item.section, { cascade: true })
  items: AtpTemplateItem[];
}
