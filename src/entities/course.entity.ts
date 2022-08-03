import { Column, Entity, AfterLoad } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

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

  @AfterLoad()
  setLessonHours() {
    this.lesson_hours = Math.round(this.duration / 40);
  }
}
