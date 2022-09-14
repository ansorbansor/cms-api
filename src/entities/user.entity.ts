import {
  Column,
  AfterLoad,
  Entity,
  Index,
  BeforeInsert,
  BeforeUpdate,
  JoinColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { EntityHelper } from 'src/utils/entity-helper';
import { AuthProvidersEnum } from 'src/utils/enums';
import { FileEntity } from './file.entity';
import { UserRoles } from './user-role.entity';
import { EmployeeUnit } from './employee-unit.entity';
import { EmployeeLevel } from './employee-level.entity';
import { EmployeePosition } from './employee-position.entity';
import { UserCourse } from './user-course.entity';
import { UserTopic } from './user-topic.entity';

@Entity({ name: 'users' })
export class User extends EntityHelper {
  @Index()
  @Column()
  name: string | null;

  @Column({ unique: true })
  nip: string;

  @Column({ unique: true })
  email: string | null;

  @Column()
  password: string;

  public previousPassword: string;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.previousPassword !== this.password && this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Column()
  photo?: number;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile?: FileEntity;

  @Column({})
  unit_id: number;

  @Column({})
  level_id: number;

  @Column({})
  position_id: number;

  @Column({})
  course_level: number;

  @Column({ default: true })
  @Index()
  status: boolean;

  @Column({ default: false })
  @Index()
  blacklist: boolean;

  @Column({ nullable: true })
  notification_token: string | null;

  @Column({ nullable: true })
  hash: string | null;

  @Column()
  level: number;

  @OneToMany(() => UserRoles, (userRole) => userRole.user, {
    eager: true,
  })
  @JoinColumn()
  userRole?: UserRoles[];

  @ManyToOne(() => EmployeeUnit, (employeeUnit) => employeeUnit.id, {
    eager: true,
  })
  @JoinColumn({ name: 'unit_id' })
  employeeUnit?: EmployeeUnit | null;

  @ManyToOne(() => EmployeeLevel, (employeeLevel) => employeeLevel.id, {
    eager: true,
  })
  @JoinColumn({ name: 'level_id' })
  employeeLevel?: EmployeeLevel | null;

  @ManyToOne(
    () => EmployeePosition,
    (employeePosition) => employeePosition.id,
    {
      eager: true,
    },
  )
  @JoinColumn({ name: 'position_id' })
  employeePosition?: EmployeePosition | null;

  @OneToMany(() => UserCourse, (userCourse) => userCourse.user)
  @JoinColumn()
  userCourse?: UserCourse[] | null;

  @OneToMany(() => UserTopic, (userTopic) => userTopic.user)
  @JoinColumn()
  userTopic?: UserTopic[] | null;

  total_lesson_hours = 0;

  @AfterLoad()
  setLessonHours() {
    if (this.userCourse && this.userCourse.length > 1) {
      this.total_lesson_hours = 0;
      this.userCourse.forEach((element) => {
        this.total_lesson_hours =
          this.total_lesson_hours + element.course.lesson_hours;
      });
    }
  }
}
