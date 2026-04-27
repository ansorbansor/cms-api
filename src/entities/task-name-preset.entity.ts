import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'task_name_presets' })
export class TaskNamePreset extends EntityHelper {
  @Column({ nullable: false })
  name: string;
}
