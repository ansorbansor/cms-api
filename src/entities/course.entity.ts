import {
  Column,
  Entity,
  AfterLoad,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Provider } from './provider.entity';
import { CourseCategory } from './course-category.entity';
import { Topic } from './topic.entity';
import { CourseLevel } from './course-level.entity';
import { CourseLanguage } from './course-language.entity';
import { CoursePrice } from './course-price.entity';
import { FileEntity } from './file.entity';
import * as moment from 'moment';
import { UserLike } from './user-like.entity';

@Entity({ name: 'courses' })
export class Course extends EntityHelper {
  @Column()
  name: string;

  @Column()
  coach: string;

  @Column()
  duration: number;

  @Column()
  provider_id: number;

  @Column()
  category_id: number;

  @Column()
  status: boolean;

  @Column()
  topic_id: number;

  @Column()
  level_id: number;

  @Column()
  language_id: number;

  @Column()
  date_course: Date;
  dateCourseParse?: string;

  @Column()
  rating: number;

  @Column()
  description: string;

  @Column()
  url: string;

  @Column()
  price_id: number;

  @Column()
  price: number;

  @Column()
  freemium_code: string;

  @Column()
  photo: number;

  lesson_hours = 0;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  provider?: Provider;

  @ManyToOne(() => CourseCategory)
  @JoinColumn({ name: 'category_id' })
  courseCategory?: CourseCategory;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: 'topic_id' })
  topic?: Topic;

  @ManyToOne(() => CourseLevel)
  @JoinColumn({ name: 'level_id' })
  courseLevel?: CourseLevel;

  @ManyToOne(() => CourseLanguage)
  @JoinColumn({ name: 'language_id' })
  courseLanguage?: CourseLanguage;

  @ManyToOne(() => CoursePrice)
  @JoinColumn({ name: 'price_id' })
  coursePrice?: CoursePrice;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'photo' })
  photoFile?: FileEntity;

  @OneToMany(() => UserLike, (userLike) => userLike.course)
  @JoinColumn()
  userLike?: UserLike;

  @AfterLoad()
  setLessonHours() {
    this.dateCourseParse = this.date_course
      ? moment(this.created_at).format('yyyy-MM-D HH:mm:ss')
      : null;
    this.lesson_hours = Math.round(this.duration / 40);
  }
}
