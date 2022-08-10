import { Column, Entity, AfterLoad, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Provider } from './provider.entity';
import { CourseCategory } from './course-category.entity';
import { Topic } from './topic.entity';
import { CourseLevel } from './course-level.entity';
import { CourseLanguage } from './course-language.entity';
import { CourseRating } from './course-rating.entity';
import { CoursePrice } from './course-price.entity';
import { FileEntity } from './file.entity';

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

  @Column()
  rating_id: number;

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

  @ManyToOne(() => Provider, {
    eager: true,
  })
  @JoinColumn({ name: 'provider_id' })
  provider?: Provider;

  @ManyToOne(() => CourseCategory, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  courseCategory?: CourseCategory;

  @ManyToOne(() => Topic, {
    eager: true,
  })
  @JoinColumn({ name: 'topic_id' })
  topic?: Topic;

  @ManyToOne(() => CourseLevel, {
    eager: true,
  })
  @JoinColumn({ name: 'level_id' })
  courseLevel?: CourseLevel;

  @ManyToOne(() => CourseLanguage, {
    eager: true,
  })
  @JoinColumn({ name: 'language_id' })
  courseLanguage?: CourseLanguage;

  @ManyToOne(() => CourseRating, {
    eager: true,
  })
  @JoinColumn({ name: 'rating_id' })
  courseRating?: CourseRating;

  @ManyToOne(() => CoursePrice, {
    eager: true,
  })
  @JoinColumn({ name: 'price_id' })
  coursePrice?: CoursePrice;

  @ManyToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile?: FileEntity;

  @AfterLoad()
  setLessonHours() {
    this.lesson_hours = Math.round(this.duration / 40);
  }
}
