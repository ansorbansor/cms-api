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

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photo?: FileEntity;

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
  @Index()
  hash: string | null;

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
}
