import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { CourseCategory } from './course-category.entity';

@Entity({ name: 'pkasn_programs' })
export class PKASNProgram extends EntityHelper {
  @Column()
  name: string;

  @Column()
  code: string;

  @OneToMany(() => CourseCategory, (category) => category.pkasnProgram)
  @JoinColumn()
  categories?: CourseCategory[];
}
