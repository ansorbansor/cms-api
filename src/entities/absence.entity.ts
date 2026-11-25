import { AfterLoad, Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import moment from 'moment';
import { FileEntity } from './file.entity';

export enum AbsenceType {
  CLOCK_IN_OUT = 'CLOCK_IN_OUT',
  IZIN_POTONG_GAJI = 'IZIN_POTONG_GAJI',
  CUTI_TAHUNAN = 'CUTI_TAHUNAN',
  SAKIT = 'SAKIT',
  CUTI_KHUSUS = 'CUTI_KHUSUS',
}

export enum AbsenceStatus {
  COMPLETED = 'COMPLETED',
  PENDING_EVIDENCE = 'PENDING_EVIDENCE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AUTO_POTONG_GAJI = 'AUTO_POTONG_GAJI',
}

@Entity({ name: 'absence' })
export class Absence extends EntityHelper {
  @Column()
  user_id?: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: AbsenceType.CLOCK_IN_OUT,
    nullable: true,
  })
  absence_type?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AbsenceStatus.COMPLETED,
    nullable: true,
  })
  status?: string;

  @Column({ type: 'date', nullable: true })
  absence_date?: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_clarification?: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  special_leave_type?: string;

  @Column({ nullable: true })
  evidence_file_id?: number;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'evidence_file_id' })
  evidence_file?: FileEntity;

  @Column({ type: 'timestamp', nullable: true })
  evidence_uploaded_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadline_at?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  @Column({ type: 'timestamp', nullable: true })
  rejected_at?: Date;

  @Column({ nullable: true })
  reviewed_by?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at?: Date;

  @Column({ nullable: true })
  clock_in?: Date;

  @Column({ nullable: true })
  clock_out?: Date;

  @Column({ nullable: true })
  clock_in_photo?: number;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'clock_in_photo' })
  clock_in_photo_file: FileEntity;

  @Column({ nullable: true })
  clock_out_photo?: number;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'clock_out_photo' })
  clock_out_photo_file: FileEntity;

  @Column({ nullable: true })
  clock_in_latitude?: number;

  @Column({ nullable: true })
  clock_in_longitude?: number;

  @Column({ nullable: true })
  clock_out_latitude?: number;

  @Column({ nullable: true })
  clock_out_longitude?: number;

  @Column({ nullable: true })
  late_reason?: string;

  @Column({ nullable: true })
  clock_in_kecamatan?: string;

  @Column({ nullable: true })
  clock_out_kecamatan?: string;

  @Column({ type: 'text', nullable: true })
  activity_plan?: string;

  @Column({ type: 'text', nullable: true })
  activity_result?: string;

  @Column({ default: 'app', nullable: true })
  source?: string;

  @Column({ default: 'app', nullable: true })
  clock_in_source?: string;

  @Column({ default: 'app', nullable: true })
  clock_out_source?: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  clockInParseDate: string;
  clockOutParseDate: string;

  @AfterLoad()
  setEntityName() {
    this.clockInParseDate = this.clock_in
      ? moment(this.clock_in).format('dddd, DD MMMM YYYY HH:mm:ss')
      : null;
    this.clockOutParseDate = this.clock_out
      ? moment(this.clock_out).format('dddd, DD MMMM YYYY HH:mm:ss')
      : null;
    this.__entity = this.constructor.name;
  }
}
