import { Column, Entity, AfterLoad, OneToOne, JoinColumn } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import * as moment from 'moment';
import { Course } from './course.entity';

@Entity({ name: 'temporary_courses' })
export class TemporaryCourse extends EntityHelper {
  @Column()
  external_id: string;

  @Column()
  name: string;

  @Column()
  coach: string;

  @Column()
  duration: number;

  @Column()
  provider_id: number;

  @Column()
  category: string;

  @Column()
  topic: string;

  @Column()
  level: string;

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
  price: number;

  @Column()
  freemium_code: string;

  @Column()
  photo: string;

  @Column()
  language: string;

  @OneToOne(() => Course, (course) => course.temporaryCourse)
  @JoinColumn({ name: 'external_id' })
  course?: Course;

  lesson_hours = 0;

  @AfterLoad()
  setLessonHours() {
    this.dateCourseParse = this.date_course
      ? moment(this.created_at).format('yyyy-MM-D HH:mm:ss')
      : null;
    this.lesson_hours = Math.round(this.duration / 40);
  }
}
