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
import { EmployeePosition } from './employee-position.entity';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Entity({ name: 'users' })
export class User extends EntityHelper {
  public previousPassword: string;

  public generatePassword?: boolean;

  @Index()
  @Column()
  name: string | null;

  @Column({ unique: true })
  nik: string;

  @Column({ unique: true })
  email: string | null;

  @Column()
  password: string;

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Column()
  photo?: number;

  @Column({})
  employee_position_id: number;

  @Column({})
  phone: string;

  @Column({ default: 1 })
  @Index()
  status: boolean;

  @Column({ nullable: true })
  notification_token: string | null;

  @Column({ nullable: true })
  hash: string | null;

  @Column({ nullable: true })
  region: string | null;

  @Column({ nullable: true })
  gm_region: string | null;

  @Column({ nullable: true })
  company: string | null;

  @Column({ nullable: true })
  category: string | null;

  @Column({ nullable: true })
  team_number: string | null;

  @Column({ nullable: true })
  uniportal_account: string | null;

  @Column({ nullable: true })
  project: string | null;

  @Column({ nullable: true })
  pass_id_number: string | null;

  @Column({ nullable: true })
  cyber_security_status: boolean | null;

  @Column({ nullable: true })
  level_iresource: string | null;

  @Column({ nullable: true })
  wah_certification_number: string | null;

  @Column({ nullable: true })
  wah_validation_end_date: Date | null;

  @Column({ nullable: true })
  electrical_certification_number: string | null;

  @Column({ nullable: true })
  electrical_validation_end_date: Date | null;

  @Column({ nullable: true })
  firstaid_certification_number: string | null;

  @Column({ nullable: true })
  firstaid_validation_end_date: Date | null;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile?: FileEntity;

  @OneToMany(() => UserRoles, (userRole) => userRole.user, {
    eager: true,
  })
  @JoinColumn()
  userRoles?: UserRoles[];

  @ManyToOne(
    () => EmployeePosition,
    (employeePosition) => employeePosition.id,
    {
      eager: true,
    },
  )
  @JoinColumn({ name: 'employee_position_id' })
  employeePosition?: EmployeePosition | null;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.previousPassword !== this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    } else if (this.generatePassword) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(randomStringGenerator(), salt);
    }
  }
}
