import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Milestone } from './milestone.entity';
import { User } from './user.entity';
import { FileEntity } from './file.entity';
import { WorkloadTaskAttachment } from './workload-task-attachment.entity';

@Entity({ name: 'workload_tasks' })
export class WorkloadTask extends EntityHelper {
  @Column({ nullable: true })
  milestone_id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  assigned_to: number;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  status: string; // Pending, In Progress, Completed, Issue, No Need

  @Column({ type: 'timestamp', nullable: true })
  in_progress_at: Date;

  @Column({ nullable: true })
  evidence_file_id: number;

  @Column({ nullable: true })
  watermark_notes: string;

  @Column({ type: 'json', nullable: true })
  pic_history: any;

  @Column({ nullable: true })
  task_order_index: number;

  @ManyToOne(() => Milestone, (milestone: Milestone) => milestone.tasks)
  @JoinColumn({ name: 'milestone_id' })
  milestone: Milestone;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assigned_to_user: User;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'evidence_file_id' })
  evidence_file: FileEntity;

  @OneToMany(() => WorkloadTaskAttachment, (a) => a.task)
  attachments: WorkloadTaskAttachment[];
}
