import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { WorkloadTask } from './workload-task.entity';
import { FileEntity } from './file.entity';

@Entity({ name: 'workload_task_attachments' })
export class WorkloadTaskAttachment extends EntityHelper {
  @Column({ nullable: false })
  task_id: number;

  @Column({ nullable: false })
  file_id: number;

  @ManyToOne(() => WorkloadTask)
  @JoinColumn({ name: 'task_id' })
  task: WorkloadTask;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;
}
