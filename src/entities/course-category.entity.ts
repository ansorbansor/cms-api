import {
  AfterLoad,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Topic } from './topic.entity';
import { FileEntity } from './file.entity';
import { Course } from './course.entity';

@Entity({ name: 'categories' })
export class CourseCategory extends EntityHelper {
  @Column()
  name: string;

  @Column()
  photo: number;

  @Column()
  pkasn_program: string;

  @OneToMany(() => Topic, (topics) => topics.category)
  @JoinColumn()
  topic?: Topic[];
  topic_count: number;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile: FileEntity;

  @OneToMany(() => Course, (course) => course.courseCategory)
  @JoinColumn()
  course?: Course[];
  course_count: number;

  @AfterLoad()
  setCount() {
    this.topic_count = this.topic ? this.topic.length : 0;
    this.course_count = this.course ? this.course.length : 0;
  }
}
