import {
  Column,
  AfterLoad,
  Entity,
  Index,
  BeforeInsert,
  BeforeUpdate,
  JoinColumn,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { EntityHelper } from 'src/utils/entity-helper';
import { AuthProvidersEnum } from 'src/utils/enums';
import { FileEntity } from './file.entity';
import { EmployeePosition } from './employee-position.entity';

@Entity({ name: 'users' })
export class User extends EntityHelper {
  public previousPassword: string;

  public generatePassword?: boolean;

  @Index()
  @Column({ nullable: true })
  name: string | null;

  @Column({ unique: true })
  nik: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column()
  password: string;

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Column({ nullable: true })
  photo?: number | null;

  @Column({ nullable: true })
  employee_position_id: number | null;

  @Column({ nullable: true })
  phone: string | null;

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
  cyber_security_status: string | null;

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

  @Column({ nullable: true })
  status_description: string | null;

  @Column({ nullable: true })
  bank: string | null;

  @Column({ nullable: true })
  bank_account_number: string | null;

  @Column({ nullable: true })
  app_session_id: string | null;

  @Column({ type: 'float', nullable: true })
  live_lat: number | null;

  @Column({ type: 'float', nullable: true })
  live_lng: number | null;

  @Column({ type: 'timestamp', nullable: true })
  live_updated_at: Date | null;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile?: FileEntity;

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
      this.password = await bcrypt.hash('Biosron123', salt);
    }
  }
}
