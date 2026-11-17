import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AtpDocument } from './atp-document.entity';
import { User } from './user.entity';

@Entity({ name: 'atp_document_reviews' })
export class AtpDocumentReview extends EntityHelper {
  @ApiProperty({ example: 1 })
  @Column()
  document_id: number;

  @ApiProperty({ example: 'MS RTS' })
  @Column()
  reviewer_role: string; // 'MS RTS' | 'XLS RTH Team' | 'XLS RTH' | 'QC Internal'

  @ApiProperty({ example: 'Komara Sandi' })
  @Column()
  pic_name: string;

  @ApiProperty({ example: 1 })
  @Column({ nullable: true })
  user_id: number;

  @ApiProperty({ example: 'APPROVED' })
  @Column()
  status: string; // 'APPROVED' | 'PUNCHLIST' | 'REVISE'

  @ApiProperty({ example: 'data:image/png;base64,...' })
  @Column({ nullable: true, type: 'text' })
  signature_url: string;

  @ApiProperty({ example: 'Catatan punchlist minor' })
  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @ApiProperty({ example: '2026-09-18T10:00:00Z' })
  @Column({ nullable: true, type: 'timestamp with time zone' })
  signed_at: Date;

  @ManyToOne(() => AtpDocument, (doc) => doc.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: AtpDocument;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
