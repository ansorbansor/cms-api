import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'course_languages' })
export class CourseLanguage extends EntityHelper {
  @Column()
  name: string;
}
