import {
  Column,
  Entity,
  AfterLoad,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Provider } from './provider.entity';
import { CourseCategory } from './course-category.entity';
import { Topic } from './topic.entity';
import { CourseLevel } from './course-level.entity';
import { CoursePrice } from './course-price.entity';
import { FileEntity } from './file.entity';
import * as moment from 'moment';
import { UserLike } from './user-like.entity';
import { UserCourse } from './user-course.entity';
import { CourseLanguageTransaction } from './course-language-transaction.entity';
import { CouponSubmission } from './coupon-submission.entity';
import { EditorChoiceCourse } from './editor-choice-course.entity';
import { TemporaryCourse } from './temporary-course.entity';

@Entity({ name: 'courses' })
export class Course extends EntityHelper {
  @Column()
  external_id: number;

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
  status: number;

  @Column()
  topic_id: number;

  @Column()
  level_id: number;

  @Column()
  date_course: Date;
  dateCourseParse?: string;

  @Column()
  rating: number;

  @Column()
  rating_count: number;

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

  isDataComplete(except: string[]) {
    let thisVar = [
      'provider_id',
      'category_id',
      'topic_id',
      'level_id',
      'duration',
      'language_id',
      'price_id',
    ];

    thisVar = thisVar.filter((e) => {
      return !except.find((x) => e == x);
    });

    thisVar[thisVar.indexOf('language_id')] = 'courseLanguage';

    for (const element of thisVar) {
      if (
        this[element] == null ||
        (Array.isArray(this[element]) && this[element].length == 0)
      ) {
        switch (element) {
          case 'provider_id': {
            return 'Penyelenggara tidak boleh kosong pada semua pembelajaran untuk mengaktifkan!';
          }
          case 'category_id': {
            return 'Kategori tidak boleh kosong pada semua pembelajaran untuk mengaktifkan!';
          }
          case 'topic_id': {
            return 'Topik tidak boleh kosong pada semua pembelajaran untuk mengaktifkan!';
          }
          case 'level_id': {
            return 'Level tidak boleh kosong pada semua pembelajaran untuk mengaktifkan!';
          }
          case 'duration': {
            return 'Durasi tidak boleh kosong pada semua pembelajaran untuk mengaktifkan!';
          }
          case 'courseLanguage': {
            return 'Bahasa tidak boleh kosong pada semua pembelajaran untuk mengaktifkan!';
          }
          case 'price_id': {
            return 'Jenis harga tidak boleh kosong pada semua pembelajaran untuk mengaktifkan!';
          }
        }
      }
    }

    return null;
  }

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

  @ManyToOne(() => CoursePrice)
  @JoinColumn({ name: 'price_id' })
  coursePrice?: CoursePrice;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'photo' })
  photoFile?: FileEntity;

  @OneToMany(() => CouponSubmission, (coupon) => coupon.course)
  @JoinColumn()
  couponSubmission?: CouponSubmission;

  @OneToMany(
    () => CourseLanguageTransaction,
    (courseLanguage) => courseLanguage.course,
  )
  @JoinColumn()
  courseLanguage?: CourseLanguageTransaction[];

  @OneToMany(() => UserLike, (userLike) => userLike.course)
  @JoinColumn()
  userLike?: UserLike[];

  @OneToMany(() => UserCourse, (userCourse) => userCourse.course)
  @JoinColumn()
  userCourse?: UserCourse[];
  userCourseCount = 0;

  @OneToOne(
    () => EditorChoiceCourse,
    (editorChoiceCourse) => editorChoiceCourse.courseData,
  )
  editorChoiceCourse?: EditorChoiceCourse;

  @OneToOne(() => TemporaryCourse, (temporaryCourse) => temporaryCourse.course)
  @JoinColumn({ name: 'external_id', referencedColumnName: 'external_id' })
  temporaryCourse?: TemporaryCourse;

  @AfterLoad()
  setLessonHours() {
    this.dateCourseParse = this.date_course
      ? moment(this.created_at).format('yyyy-MM-D HH:mm:ss')
      : null;
    this.lesson_hours = Math.round(this.duration / 40);
  }
}
