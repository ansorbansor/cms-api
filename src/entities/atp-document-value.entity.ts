import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AtpDocument } from './atp-document.entity';
import { AtpTemplateItem } from './atp-template-item.entity';
import { FileEntity } from './file.entity';
import { TakeDataSubmission } from './take-data-submission.entity';

@Entity({ name: 'atp_document_values' })
export class AtpDocumentValue extends EntityHelper {
  @ApiProperty({ example: 1 })
  @Column()
  document_id: number;

  @ApiProperty({ example: 1 })
  @Column()
  template_item_id: number;

  @ApiProperty({ example: 'Pass' })
  @Column({ nullable: true, type: 'text' })
  text_value: string;

  @ApiProperty({ example: 'Pass' })
  @Column({ nullable: true })
  test_result: string; // 'Pass' | 'Reject' | 'N/A'

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  photo_id: number;

  @ApiProperty({ example: 'https://.../photo.jpg' })
  @Column({ nullable: true, type: 'text' })
  photo_url: string;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  take_data_submission_id: number;

  @ApiProperty({ example: 'Catatan teknis atau punchlist' })
  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @ManyToOne(() => AtpDocument, (doc) => doc.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: AtpDocument;

  @ManyToOne(() => AtpTemplateItem)
  @JoinColumn({ name: 'template_item_id' })
  template_item: AtpTemplateItem;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'photo_id' })
  photo: FileEntity;

  @ManyToOne(() => TakeDataSubmission)
  @JoinColumn({ name: 'take_data_submission_id' })
  take_data_submission: TakeDataSubmission;
}
