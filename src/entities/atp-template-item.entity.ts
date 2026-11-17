import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AtpTemplateSection } from './atp-template-section.entity';
import { TakeDataTemplateItem } from './take-data-template-item.entity';

@Entity({ name: 'atp_template_items' })
export class AtpTemplateItem extends EntityHelper {
  @ApiProperty({ example: 1 })
  @Column()
  section_id: number;

  @ApiProperty({ example: '2.1.1.1' })
  @Column({ nullable: true })
  item_no: string;

  @ApiProperty({ example: 'A1' })
  @Column({ nullable: true })
  picture_no: string;

  @ApiProperty({ example: 'Site to be clean and tidy inside cabinet' })
  @Column()
  label: string;

  @ApiProperty({ example: 'Detailed description or guideline' })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @ApiProperty({ example: 'checklist_pass_fail' })
  @Column({ default: 'checklist_pass_fail' })
  item_type: string; // 'text' | 'number' | 'select' | 'date' | 'checklist_pass_fail' | 'photo' | 'signature'

  @ApiProperty({ example: 'Minor' })
  @Column({ default: 'Minor' })
  severity: string; // 'Critical' | 'Major' | 'Minor' | 'Info Only' | 'N/A'

  @ApiProperty({ example: ['Greenfield', 'Rooftop'] })
  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @ApiProperty({ example: 'Site Cleaning' })
  @Column({ nullable: true })
  take_data_tag: string;

  @ApiProperty({ example: 57 })
  @Column({ nullable: true })
  take_data_template_item_id: number;

  @ApiProperty({ example: 1 })
  @Column({ default: 0 })
  order_index: number;

  @ManyToOne(() => AtpTemplateSection, (section) => section.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: AtpTemplateSection;

  @ManyToOne(() => TakeDataTemplateItem)
  @JoinColumn({ name: 'take_data_template_item_id' })
  take_data_template_item: TakeDataTemplateItem;
}
