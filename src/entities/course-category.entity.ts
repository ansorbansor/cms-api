import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Topic } from './topic.entity';
import { FileEntity } from './file.entity';

@Entity({ name: 'categories' })
export class CourseCategory extends EntityHelper {
  @Column()
  name: string;

  @Column()
  photo: number;

  @OneToMany(() => Topic, (topics) => topics.category)
  @JoinColumn()
  topic?: Topic[];

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile: FileEntity;
}
